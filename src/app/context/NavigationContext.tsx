"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { ScreenLoader } from "@/app/components/ScreenLoader";

/**
 * Global navigation state + an imperative, route-aware skeleton overlay.
 *
 * The overlay is managed OUTSIDE the main React tree for two reasons:
 *
 *  1. React 18 concurrent rendering batches our `setState` into Next.js's
 *     router transition, so a React-state-driven overlay can never beat the
 *     navigation to paint. By attaching a DOM element directly on click we
 *     paint on the next frame, ~50ms after click in practice.
 *
 *  2. We still want the overlay to use the real `<ScreenSkeleton>` component
 *     so there's no markup duplication and so each variant looks identical to
 *     the per-screen fallback it's covering. We do that by mounting a
 *     SEPARATE React root inside the overlay element — that root is
 *     independent of Next.js's router, so it isn't caught in the transition.
 *     `flushSync` guarantees the skeleton paints before the overlay is shown.
 *
 * The overlay is hidden once the URL has caught up AND <main> no longer
 * contains any `role="status"` skeletons (i.e. per-screen data has loaded).
 *
 * Covers every navigation with no per-page changes:
 *   - `<Link>` clicks (capture-phase document listener)
 *   - Programmatic `router.push` / `router.replace` (patched once at mount)
 */

type NavigationContextValue = {
  pendingNavPath: string | null;
  setPendingNavigation: (path: string | null) => void;
  isTransitioning: boolean;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const SAFETY_TIMEOUT_MS = 10_000;
const POST_COMMIT_SETTLE_MS = 60;

function isInternalAnchor(anchor: HTMLAnchorElement): boolean {
  if (!anchor.href) return false;
  if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const rel = anchor.getAttribute("rel") ?? "";
  if (rel.includes("external")) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

function toPathWithQuery(input: string | URL): string | null {
  try {
    const url = typeof input === "string" ? new URL(input, window.location.href) : input;
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

function samePath(a: string, b: string): boolean {
  const stripA = a.split("?")[0] ?? a;
  const stripB = b.split("?")[0] ?? b;
  if (stripA === stripB) return true;
  return stripB.startsWith(stripA + "/") || stripA.startsWith(stripB + "/");
}

// ---- Imperative overlay controller ---------------------------------------

type OverlayController = {
  show: (targetPath: string) => void;
  hide: () => void;
  maybeHideIfReady: () => void;
  markCommitted: () => void;
};

function createOverlayController(): OverlayController {
  let element: HTMLDivElement | null = null;
  let contentEl: HTMLDivElement | null = null;
  let reactRoot: Root | null = null;
  let safetyTimer: number | null = null;
  let urlCommitted = false;
  let mainObserver: MutationObserver | null = null;
  let pendingFrame: number | null = null;

  const ensureElement = (): HTMLDivElement => {
    if (element) return element;
    const el = document.createElement("div");
    el.setAttribute("data-nav-overlay", "true");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Loading");
    // Solid background so the overlay is instantly "covering" even in the
    // ~1 frame before the React root commits its skeleton markup.
    el.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "background:var(--background, #ffffff)",
      "pointer-events:auto",
      "overflow:auto",
      "padding:20px",
      "box-sizing:border-box",
      "margin:0",
    ].join(";");

    const content = document.createElement("div");
    content.setAttribute("data-nav-overlay-content", "true");
    content.style.cssText = "width:100%;height:100%";
    el.appendChild(content);
    contentEl = content;
    element = el;
    return el;
  };

  const ensureRoot = (): Root => {
    if (reactRoot) return reactRoot;
    if (!contentEl) ensureElement();
    reactRoot = createRoot(contentEl!);
    return reactRoot;
  };

  const positionOverMain = (el: HTMLDivElement) => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) {
      el.style.left = "0";
      el.style.top = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      return;
    }
    const rect = main.getBoundingClientRect();
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.style.right = "auto";
    el.style.bottom = "auto";
  };

  const mainHasSkeleton = (): boolean => {
    const main = document.querySelector("main");
    if (!main) return false;
    return !!main.querySelector('[role="status"][aria-live="polite"]');
  };

  const mainHasContent = (): boolean => {
    const main = document.querySelector("main");
    if (!main) return false;
    const children = main.querySelectorAll("*");
    for (const child of Array.from(children)) {
      if (child.getAttribute("role") === "status") continue;
      if ((child as HTMLElement).offsetHeight > 0) return true;
    }
    return false;
  };

  const stopObservers = () => {
    mainObserver?.disconnect();
    mainObserver = null;
    if (pendingFrame !== null) {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
    }
  };

  const startMainObserver = () => {
    stopObservers();
    const main = document.querySelector("main");
    if (!main) return;
    mainObserver = new MutationObserver(() => {
      controller.maybeHideIfReady();
    });
    mainObserver.observe(main, { childList: true, subtree: true });
  };

  const controller: OverlayController = {
    show(path: string) {
      urlCommitted = false;
      const el = ensureElement();
      positionOverMain(el);
      if (!el.isConnected) document.body.appendChild(el);
      document.body.setAttribute("data-navigating", "true");

      // Use auth variant when there is no app layout yet (e.g. login → dashboard),
      // and the lighter app variant when navigating between in-app pages.
      const loaderVariant = document.querySelector("main") ? "app" : "auth";
      const root = ensureRoot();
      queueMicrotask(() => {
        flushSync(() => {
          root.render(<ScreenLoader variant={loaderVariant} />);
        });
      });

      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => {
        controller.hide();
      }, SAFETY_TIMEOUT_MS);
    },
    markCommitted() {
      urlCommitted = true;
      startMainObserver();
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = requestAnimationFrame(() => {
          window.setTimeout(() => controller.maybeHideIfReady(), POST_COMMIT_SETTLE_MS);
        });
      });
    },
    maybeHideIfReady() {
      if (!element || !element.isConnected) return;
      if (!urlCommitted) return;
      if (mainHasSkeleton()) return;
      if (!mainHasContent()) return;
      controller.hide();
    },
    hide() {
      stopObservers();
      if (safetyTimer !== null) {
        window.clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      if (element && element.isConnected) element.remove();
      document.body.removeAttribute("data-navigating");
      urlCommitted = false;
      // Don't unmount the React root — we'll re-use it on the next navigation
      // to avoid recreating it each time.
    },
  };
  return controller;
}

let overlayInstance: OverlayController | null = null;
function getOverlay(): OverlayController | null {
  if (typeof window === "undefined") return null;
  if (!overlayInstance) overlayInstance = createOverlayController();
  return overlayInstance;
}

// ---- React provider ------------------------------------------------------

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingNavPath, setPendingNavPathState] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);

  const setPendingNavigation = useCallback((path: string | null) => {
    pendingRef.current = path;
    setPendingNavPathState(path);
    const overlay = getOverlay();
    if (!overlay) return;
    if (path) overlay.show(path);
    else overlay.hide();
  }, []);

  // Capture-phase click listener — runs before Next.js's Link handler.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalAnchor(anchor)) return;
      const next = toPathWithQuery(anchor.href);
      if (!next) return;
      const current = window.location.pathname + window.location.search;
      if (samePath(next, current)) return;
      setPendingNavigation(next);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [setPendingNavigation]);

  // Patch router.push / router.replace once so programmatic navigations
  // also trigger the overlay.
  useEffect(() => {
    const origPush = router.push.bind(router);
    const origReplace = router.replace.bind(router);
    (router as { push: typeof router.push }).push = (href, options) => {
      const next = toPathWithQuery(href);
      if (next) {
        const current = window.location.pathname + window.location.search;
        if (!samePath(next, current)) setPendingNavigation(next);
      }
      return origPush(href, options);
    };
    (router as { replace: typeof router.replace }).replace = (href, options) => {
      const next = toPathWithQuery(href);
      if (next) {
        const current = window.location.pathname + window.location.search;
        if (!samePath(next, current)) setPendingNavigation(next);
      }
      return origReplace(href, options);
    };
    return () => {
      (router as { push: typeof router.push }).push = origPush;
      (router as { replace: typeof router.replace }).replace = origReplace;
    };
  }, [router, setPendingNavigation]);

  // When the URL catches up with the target, tell the overlay so it can
  // wait for <main> to stop rendering skeletons and then hide itself.
  useEffect(() => {
    if (!pendingNavPath || !pathname) return;
    if (samePath(pendingNavPath, pathname)) {
      pendingRef.current = null;
      setPendingNavPathState(null);
      getOverlay()?.markCommitted();
    }
  }, [pendingNavPath, pathname]);

  const isTransitioning = pendingNavPath !== null;

  const value = useMemo(
    () => ({ pendingNavPath, setPendingNavigation, isTransitioning }),
    [pendingNavPath, setPendingNavigation, isTransitioning],
  );

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    return {
      pendingNavPath: null,
      setPendingNavigation: () => {},
      isTransitioning: false,
    };
  }
  return ctx;
}
