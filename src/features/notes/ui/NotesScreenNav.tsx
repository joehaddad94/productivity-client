"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

export function NotesSidebarSectionHeader({
  label,
  expanded,
  onToggle,
  action,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide hover:text-foreground transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        {label}
      </button>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          data-testid="tag-filter-manage"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function NotesSidebarNavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left cursor-pointer",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "text-[10px] tabular-nums shrink-0",
            active ? "text-primary/70" : "text-muted-foreground/50",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
