"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/app/context/AuthContext";
import { Toaster } from "@/app/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
