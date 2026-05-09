"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initAnalytics, identifyUser, resetAnalyticsUser } from "@/lib/analytics";
import { useAuth } from "@/app/context/AuthContext";

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
      <PageViewTracker />
      <UserIdentifier />
      {children}
    </>
  );
}
