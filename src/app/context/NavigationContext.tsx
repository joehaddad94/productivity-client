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

/**
 * Global navigation state + an imperative DOM overlay.
 *
 * The overlay is managed OUTSIDE React's render pipeline so it can appear on
 * the same frame as the click. React 18's concurrent renderer batches state
 * updates triggered inside a Next.js router transition, so a React-managed
 * overlay never beats the navigation to the screen — it appears only when
 * the new route has already committed, defeating the point.
 *
 * Instead we:
 *   1. Create a fixed skeleton DOM node once, lazily, on the client.
 *   2. Show it imperatively on any internal click or programmatic router.push
 *      / router.replace. The DOM mutation is synchronous — the user sees the
 *      overlay on the very next paint.
 *   3. Hide it when both (a) the URL has caught up with the navigation target
 *      and (b) the new route's main content has no remaining skeleton nodes
 *      (per-screen `role="status"` fallbacks). We observe (b) via a
 *      MutationObserver on <main>, so we hide the overlay the instant the
 *      real UI is ready — not before, not after.
 *
 * Covers every navigation without per-page changes:
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
  let safetyTimer: number | null = null;
  let targetPath: string | null = null;
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
    // Positioning: cover the main content region, not the sidebar.
    // We use fixed with left tied to the sidebar width via a CSS variable
    // fallback. The stylesheet can refine this; inline styles give us a solid
    // default that works on first paint without waiting for CSS to apply.
    el.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9999",
      "background:var(--background, #ffffff)",
      "pointer-events:auto",
      "display:flex",
      "align-items:flex-start",
      "justify-content:flex-start",
      "padding:0",
      "margin:0",
    ].join(";");
    // The skeleton markup mirrors the generic ScreenSkeleton so it looks
    // identical to the per-screen fallbacks it's covering.
    el.innerHTML = `
      <style>
        @keyframes __nav-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        [data-nav-overlay] .__navblk {
          border-radius: 6px;
          background: linear-gradient(90deg, var(--muted, #eee) 0%, var(--accent, #e5e5e5) 50%, var(--muted, #eee) 100%);
          background-size: 200% 100%;
          animation: __nav-shimmer 1.5s ease-in-out infinite;
        }
        [data-nav-overlay] .__navrow { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        [data-nav-overlay] .__navcard { border:1px solid var(--border, #e5e5e5); background: var(--card, #fff); border-radius: 12px; padding: 16px; display:flex; flex-direction:column; gap: 12px; }
      </style>
      <div style="width:100%;max-width:100%;margin-left:auto;display:flex;flex-direction:column;gap:20px;padding:20px;box-sizing:border-box" data-nav-overlay-inner>
        <div class="__navrow">
          <div class="__navblk" style="height:28px;width:200px"></div>
          <div style="display:flex;gap:8px">
            <div class="__navblk" style="height:36px;width:96px"></div>
            <div class="__navblk" style="height:36px;width:112px"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="__navcard">
            <div class="__navblk" style="height:20px;width:60%"></div>
            <div class="__navblk" style="height:16px;width:100%"></div>
            <div class="__navblk" style="height:16px;width:83%"></div>
            <div class="__navblk" style="height:16px;width:75%"></div>
          </div>
          <div class="__navcard">
            <div class="__navblk" style="height:20px;width:55%"></div>
            <div class="__navblk" style="height:16px;width:95%"></div>
            <div class="__navblk" style="height:16px;width:70%"></div>
          </div>
          <div class="__navcard">
            <div class="__navblk" style="height:20px;width:50%"></div>
            <div class="__navblk" style="height:16px;width:88%"></div>
            <div class="__navblk" style="height:16px;width:68%"></div>
          </div>
        </div>
      </div>
    `;
    element = el;
    return el;
  };

  const positionOverOfMain = (el: HTMLDivElement) => {
    // Place overlay over main content area, leaving the sidebar exposed on
    // desktop so the user can see where they're going. We measure on show.
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
    // Our own overlay is outside main (attached to body), so it won't match.
    // Per-screen skeletons render inside main with role="status".
    return !!main.querySelector('[role="status"][aria-live="polite"]');
  };

  const mainHasContent = (): boolean => {
    const main = document.querySelector("main");
    if (!main) return false;
    // Any element that isn't a skeleton counts as "real content".
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
      targetPath = path;
      urlCommitted = false;
      const el = ensureElement();
      positionOverOfMain(el);
      if (!el.isConnected) document.body.appendChild(el);
      document.body.setAttribute("data-navigating", "true");

      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => {
        controller.hide();
      }, SAFETY_TIMEOUT_MS);
    },
    markCommitted() {
      urlCommitted = true;
      startMainObserver();
      // After commit, give React one frame to mount the new tree before we
      // start checking. Otherwise we'd race past the brief moment where
      // the new <main> is empty.
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
      targetPath = null;
      urlCommitted = false;
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
  // (redirects, workspace switches, logout, etc.) also trigger the overlay.
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

  // When pathname catches up with the target, notify the overlay that the
  // URL has committed; it will wait for <main> to stop showing skeletons
  // and then hide itself.
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
