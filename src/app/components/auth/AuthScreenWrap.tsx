"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const PAGE_BG_CLASS =
  "min-h-screen flex items-center justify-center p-4 " +
  "bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 " +
  "dark:from-gray-950 dark:via-gray-900 dark:to-gray-950";

export function AuthScreenWrap({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`relative ${PAGE_BG_CLASS}`}>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white/60 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="size-5 hidden dark:block" aria-hidden />
        <Moon className="size-5 block dark:hidden" aria-hidden />
      </button>
      {children}
    </div>
  );
}
