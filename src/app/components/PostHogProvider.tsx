"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initAnalytics, identifyUser, resetAnalyticsUser, track } from "@/lib/analytics";
import { useAuth } from "@/app/context/AuthContext";

const FEATURE_MAP: Record<string, string> = {
  "/dashboard": "dashboard",
  "/tasks": "tasks",
  "/notes": "notes",
  "/projects": "projects",
  "/calendar": "calendar",
  "/analytics": "analytics",
  "/settings": "settings",
  "/workspaces": "workspaces",
};

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initAnalytics();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
    const feature = FEATURE_MAP[pathname];
    if (feature) track("feature_visited", { feature });
  }, [pathname, searchParams]);

  return null;
}

function UserIdentifier() {
  const { user, isAuthenticated } = useAuth();
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && identifiedId.current !== user.id) {
      identifyUser(user.id, { name: user.name, email: user.email });
      identifiedId.current = user.id;
      if (!sessionStorage.getItem("ph_app_opened")) {
        track("app_opened", {});
        sessionStorage.setItem("ph_app_opened", "1");
      }
    }
    if (!isAuthenticated && identifiedId.current) {
      resetAnalyticsUser();
      identifiedId.current = null;
    }
  }, [isAuthenticated, user]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <UserIdentifier />
      {children}
    </>
  );
}
