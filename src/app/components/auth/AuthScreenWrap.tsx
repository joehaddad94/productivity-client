"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowLeft } from "lucide-react";

export function AuthScreenWrap({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors group"
      >
        <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground text-[9px] font-bold">T</span>
          </div>
          <span className="font-medium">Tasky</span>
        </div>
      </Link>

      {/* Theme toggle */}
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
