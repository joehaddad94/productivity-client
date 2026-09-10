"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import { WorkspaceProvider } from "@/app/context/WorkspaceContext";
import { NavigationProvider } from "@/app/context/NavigationContext";
import { Toaster } from "@/app/components/ui/sonner";
import { PostHogProvider } from "@/app/components/PostHogProvider";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // defaultTheme must be "system" for enableSystem to mean anything: with
  // "light" a visitor whose OS is in dark mode got the light theme until they
  // toggled manually.
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <PostHogProvider>
            <WorkspaceProvider>
              <NavigationProvider>
                <ServiceWorkerRegistrar />
                {children}
                <Toaster />
              </NavigationProvider>
            </WorkspaceProvider>
          </PostHogProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
