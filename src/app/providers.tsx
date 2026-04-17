"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import { WorkspaceProvider } from "@/app/context/WorkspaceContext";
import { NavigationProvider } from "@/app/context/NavigationContext";
import { Toaster } from "@/app/components/ui/sonner";

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
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <NavigationProvider>
              <ServiceWorkerRegistrar />
              {children}
              <Toaster />
            </NavigationProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
