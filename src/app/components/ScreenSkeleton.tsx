"use client";

import { cn } from "@/app/components/ui/utils";

const SKELETON_BASE =
  "rounded-md bg-[var(--muted)] dark:bg-[var(--muted)] overflow-hidden";
const SKELETON_SHINE = (delay = 0) => ({
  background:
    "linear-gradient(90deg, var(--muted) 0%, var(--accent) 50%, var(--muted) 100%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-shimmer 1.5s ease-in-out infinite, skeleton-flicker 1.8s ease-in-out infinite",
  animationDelay: `${delay}ms, ${delay}ms`,
});

interface ScreenSkeletonProps {
  className?: string;
  variant?:
    | "generic"
    | "notes"
    | "tasks"
    | "projects"
    | "analytics"
    | "dashboard"
    | "calendar"
    | "settings";
}

function Block({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(className, SKELETON_BASE)}
      style={SKELETON_SHINE(delay)}
    />
  );
}

function GenericSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col gap-5 p-5 min-h-[40vh]", className)}
      role="status"
      aria-live="polite"
    >
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <Block className="h-7 w-48" delay={0} />
        <div className="flex gap-2">
          <Block className="h-9 w-24" delay={120} />
          <Block className="h-9 w-28" delay={240} />
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
            <Block className="h-5 w-3/4 max-w-xs" delay={60 + i * 100} />
            <div className="space-y-2">
              <Block className="h-4 w-full" delay={80 + i * 100} />
              <Block className="h-4 w-5/6" delay={160 + i * 100} />
              <Block className="h-4 w-4/5" delay={240 + i * 100} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar / actions */}
      <div className="flex gap-2 pt-2">
        <Block className="h-10 w-32" delay={200} />
        <Block className="h-10 w-24" delay={320} />
      </div>
    </div>
  );
}

function NotesSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col lg:flex-row gap-0 h-[calc(100vh-3rem)] lg:h-screen -m-5 lg:-m-6", className)}
      role="status"
      aria-live="polite"
    >
      <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col border-r border-border/60 bg-[var(--sidebar-bg)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <Block className="h-4 w-16" delay={0} />
          <Block className="h-7 w-7 rounded-md" delay={100} />
        </div>
        <div className="px-3 py-2 border-b border-border/40">
          <Block className="h-7 w-full" delay={140} />
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <Block key={i} className="h-12 w-full rounded-lg" delay={220 + i * 80} />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="px-5 py-2.5 border-b border-border/40">
          <Block className="h-4 w-44" delay={200} />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Block className="h-10 w-64" delay={260} />
          <Block className="h-4 w-full" delay={320} />
          <Block className="h-4 w-5/6" delay={380} />
          <Block className="h-4 w-3/4" delay={440} />
        </div>
      </div>
    </div>
  );
}

function TasksSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-3xl space-y-5", className)} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <Block className="h-8 w-24" delay={0} />
        <div className="flex gap-2">
          <Block className="h-8 w-16" delay={100} />
          <Block className="h-8 w-24" delay={180} />
        </div>
      </div>
      <div className="flex gap-2">
        <Block className="h-9 flex-1" delay={220} />
        <Block className="h-9 w-36" delay={280} />
      </div>
      <div className="h-9 rounded-lg border border-border/50 p-0.5 bg-muted/40 flex gap-1">
        <Block className="h-8 flex-1" delay={320} />
        <Block className="h-8 flex-1" delay={380} />
        <Block className="h-8 flex-1" delay={440} />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Block key={i} className="h-9 w-full rounded-lg" delay={500 + i * 70} />
        ))}
      </div>
    </div>
  );
}

function ProjectsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-5xl space-y-6", className)} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <Block className="h-8 w-28" delay={0} />
        <Block className="h-8 w-28" delay={120} />
      </div>
      <Block className="h-14 w-full rounded-xl" delay={180} />
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <Block className="h-9 w-9 rounded-lg" delay={240 + i * 70} />
            <Block className="h-4 w-2/3" delay={280 + i * 70} />
            <Block className="h-3 w-1/2" delay={320 + i * 70} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-5xl space-y-6", className)} role="status" aria-live="polite">
      <Block className="h-8 w-28" delay={0} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3 rounded-xl border border-border/60 bg-card space-y-2">
            <Block className="h-3 w-2/3" delay={120 + i * 60} />
            <Block className="h-6 w-1/2" delay={180 + i * 60} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <Block className="h-4 w-1/2" delay={260 + i * 70} />
            <Block className="h-44 w-full" delay={320 + i * 70} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-3xl space-y-8", className)} role="status" aria-live="polite">
      {/* Greeting + action button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Block className="h-7 w-56" delay={0} />
          <Block className="h-4 w-64" delay={80} />
        </div>
        <Block className="h-9 w-28 rounded-md" delay={160} />
      </div>
      {/* Today section */}
      <div className="space-y-3">
        <Block className="h-5 w-24" delay={220} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3"
            >
              <Block className="h-4 w-4 rounded-full" delay={260 + i * 70} />
              <Block className="h-4 flex-1 max-w-[60%]" delay={300 + i * 70} />
              <Block className="h-4 w-16" delay={340 + i * 70} />
            </div>
          ))}
        </div>
      </div>
      {/* Upcoming section */}
      <div className="space-y-3">
        <Block className="h-5 w-28" delay={520} />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3"
            >
              <Block className="h-4 w-4 rounded-full" delay={560 + i * 70} />
              <Block className="h-4 flex-1 max-w-[55%]" delay={600 + i * 70} />
              <Block className="h-4 w-20" delay={640 + i * 70} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-5xl space-y-6", className)} role="status" aria-live="polite">
      <Block className="h-7 w-32" delay={0} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <Block className="h-5 w-32" delay={60} />
            <div className="flex gap-1">
              <Block className="h-7 w-7 rounded-md" delay={100} />
              <Block className="h-7 w-14 rounded-md" delay={140} />
              <Block className="h-7 w-7 rounded-md" delay={180} />
            </div>
          </div>
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Block key={i} className="h-4" delay={200 + i * 20} />
            ))}
          </div>
          {/* 6 weeks x 7 days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Block key={i} className="h-14 rounded-md" delay={260 + (i % 7) * 18} />
            ))}
          </div>
        </div>
        {/* Sidebar: selected day + upcoming */}
        <div className="space-y-5">
          <div className="space-y-3">
            <Block className="h-4 w-20" delay={120} />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-card p-3 space-y-2"
                >
                  <Block className="h-4 w-3/4" delay={180 + i * 70} />
                  <Block className="h-3 w-1/2" delay={220 + i * 70} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Block className="h-4 w-24" delay={400} />
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-card p-3 space-y-2"
                >
                  <Block className="h-4 w-2/3" delay={440 + i * 70} />
                  <Block className="h-3 w-1/3" delay={480 + i * 70} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex gap-8 max-w-5xl", className)}
      role="status"
      aria-live="polite"
    >
      {/* Tabs sidebar */}
      <div className="hidden md:flex flex-col gap-1 w-48 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md">
            <Block className="h-4 w-4 rounded" delay={i * 60} />
            <Block className="h-4 flex-1" delay={40 + i * 60} />
          </div>
        ))}
      </div>
      {/* Active tab content */}
      <div className="flex-1 space-y-6 max-w-2xl">
        <div className="space-y-2">
          <Block className="h-6 w-32" delay={100} />
          <Block className="h-4 w-64" delay={160} />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Block className="h-3 w-24" delay={200 + i * 80} />
              <Block className="h-9 w-full rounded-md" delay={240 + i * 80} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Block className="h-9 w-24 rounded-md" delay={600} />
        </div>
      </div>
    </div>
  );
}

export function ScreenSkeleton({ className, variant = "generic" }: ScreenSkeletonProps) {
  if (variant === "notes") return <NotesSkeleton className={className} />;
  if (variant === "tasks") return <TasksSkeleton className={className} />;
  if (variant === "projects") return <ProjectsSkeleton className={className} />;
  if (variant === "analytics") return <AnalyticsSkeleton className={className} />;
  if (variant === "dashboard") return <DashboardSkeleton className={className} />;
  if (variant === "calendar") return <CalendarSkeleton className={className} />;
  if (variant === "settings") return <SettingsSkeleton className={className} />;
  return <GenericSkeleton className={className} />;
}
