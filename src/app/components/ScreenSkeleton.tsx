"use client";

import { cn } from "@/app/components/ui/utils";

const SKELETON_BASE =
  "rounded-md bg-[var(--muted)] dark:bg-[var(--muted)] overflow-hidden";
const SKELETON_SHINE = {
  background:
    "linear-gradient(90deg, var(--muted) 0%, var(--accent) 50%, var(--muted) 100%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-shimmer 1.5s ease-in-out infinite",
};

interface ScreenSkeletonProps {
  className?: string;
}

export function ScreenSkeleton({ className }: ScreenSkeletonProps) {
  return (
    <div
      className={cn("flex flex-col gap-5 p-5 min-h-[40vh]", className)}
      role="status"
      aria-live="polite"
    >
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div
          className={cn("h-7 w-48", SKELETON_BASE)}
          style={SKELETON_SHINE}
        />
        <div className="flex gap-2">
          <div
            className={cn("h-9 w-24", SKELETON_BASE)}
            style={SKELETON_SHINE}
          />
          <div
            className={cn("h-9 w-28", SKELETON_BASE)}
            style={SKELETON_SHINE}
          />
        </div>
      </div>

      {/* Content blocks */}
      <div className="flex flex-col gap-4 flex-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border border-[var(--border)] p-4 space-y-3",
              "bg-[var(--card)] dark:bg-[var(--card)]"
            )}
          >
            <div
              className={cn("h-5 w-3/4 max-w-xs", SKELETON_BASE)}
              style={SKELETON_SHINE}
            />
            <div className="space-y-2">
              <div
                className={cn("h-4 w-full", SKELETON_BASE)}
                style={SKELETON_SHINE}
              />
              <div
                className={cn("h-4 w-5/6", SKELETON_BASE)}
                style={SKELETON_SHINE}
              />
              <div
                className={cn("h-4 w-4/5", SKELETON_BASE)}
                style={SKELETON_SHINE}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar / actions */}
      <div className="flex gap-2 pt-2">
        <div
          className={cn("h-10 w-32", SKELETON_BASE)}
          style={SKELETON_SHINE}
        />
        <div
          className={cn("h-10 w-24", SKELETON_BASE)}
          style={SKELETON_SHINE}
        />
      </div>
    </div>
  );
}
