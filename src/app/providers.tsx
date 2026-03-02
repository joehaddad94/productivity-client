"use client";

import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import { Toaster } from "@/app/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
