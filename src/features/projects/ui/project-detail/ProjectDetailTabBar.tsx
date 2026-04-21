"use client";

import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/app/components/ui/utils";

type ProjectDetailRouter = {
  replace: (href: string, options?: { scroll?: boolean }) => void;
};

export function ProjectDetailTabBar({
  projectId,
  router,
  activeTab,
  setActiveTab,
  taskCount,
  noteCount,
  isSelectMode,
  setIsSelectMode,
  setSelectedIds,
}: {
  projectId: string;
  router: ProjectDetailRouter;
  activeTab: "tasks" | "notes";
  setActiveTab: (tab: "tasks" | "notes") => void;
  taskCount: number;
  noteCount: number;
  isSelectMode: boolean;
  setIsSelectMode: Dispatch<SetStateAction<boolean>>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
}) {
  return (
    <div className="flex items-end justify-between border-b border-border/50">
      <div className="flex">
        {(["tasks", "notes"] as const).map((tab) => {
          const count = tab === "tasks" ? taskCount : noteCount;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                router.replace(`/projects/${projectId}?tab=${tab}`, { scroll: false });
              }}
              className={cn(
                "cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "tasks" ? "Tasks" : "Notes"}
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none tabular-nums",
                    active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeTab === "tasks" && (
        <button
          type="button"
          onClick={() => {
            setIsSelectMode((p) => !p);
            setSelectedIds(new Set());
          }}
          className={cn(
            "mb-1 px-3 py-1 text-xs rounded-md transition-colors",
            isSelectMode
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          {isSelectMode ? "Cancel" : "Select"}
        </button>
      )}
    </div>
  );
}
