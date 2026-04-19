"use client";

import { usePathname } from "next/navigation";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { isAuthOrFocusRoute } from "@/app/components/layout/types";

export function RouteAwareLoading() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname == null || pathname === "" || isAuthOrFocusRoute(pathname);

  return (
    <ScreenLoader
      variant={isAuthRoute ? "auth" : "app"}
      message={isAuthRoute ? "Loading…" : undefined}
    />
  );
}
