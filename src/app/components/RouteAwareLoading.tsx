"use client";

import { usePathname } from "next/navigation";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { isAuthOrFocusRoute } from "@/app/components/layout/types";

/**
 * Root loading UI: auth loader (full screen) on auth routes,
 * skeleton (with navbars) on app routes. Layout controls full screen vs navbars
 * via showSidebar, so we only pick the right component here.
 * When pathname is not yet known, show auth loader (full screen).
 */
export function RouteAwareLoading() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname == null || pathname === "" || isAuthOrFocusRoute(pathname);

  if (isAuthRoute) {
    return <ScreenLoader variant="auth" message="Loading…" />;
  }
  return <ScreenSkeleton />;
}
