"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function AuthScreenWrap({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="size-4 hidden dark:block" aria-hidden />
        <Moon className="size-4 block dark:hidden" aria-hidden />
      </button>
      {children}
    </div>
  );
}
