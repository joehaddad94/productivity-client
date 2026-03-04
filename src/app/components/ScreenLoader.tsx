"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

const AUTH_BG_CLASS =
  "min-h-screen flex items-center justify-center p-4 " +
  "bg-gradient-to-br from-emerald-100/80 via-emerald-50 to-teal-100/70 " +
  "dark:from-gray-950 dark:via-gray-900 dark:to-gray-950";

type ScreenLoaderVariant = "auth" | "app";

interface ScreenLoaderProps {
  variant?: ScreenLoaderVariant;
  message?: string;
  className?: string;
}

export function ScreenLoader({
  variant = "auth",
  message,
  className,
}: ScreenLoaderProps) {
  if (variant === "auth") {
    return (
      <div className={cn(AUTH_BG_CLASS, className)} role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-xl bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center">
            <Loader2
              className="size-7 text-primary animate-spin"
              aria-hidden
            />
          </div>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs text-center">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[40vh] py-12",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="size-10 text-primary animate-spin"
          aria-hidden
        />
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}
