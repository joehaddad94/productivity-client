"use client";

import { cn } from "@/app/components/ui/utils";
import type { TaskPriority } from "../hooks/useDashboardScreen";

const PRIORITY_CONFIG: Record<NonNullable<TaskPriority>, { label: string; btn: string }> = {
  low:    { label: "L", btn: "border-gray-300   text-gray-500   bg-gray-50   dark:bg-gray-900   dark:border-gray-600" },
  medium: { label: "M", btn: "border-amber-300  text-amber-600  bg-amber-50  dark:bg-amber-950  dark:border-amber-700" },
  high:   { label: "H", btn: "border-red-300    text-red-600    bg-red-50    dark:bg-red-950    dark:border-red-700"   },
};

const PRIORITY_CYCLE: TaskPriority[] = [null, "low", "medium", "high"];

interface PriorityToggleProps {
  value: TaskPriority;
  onChange: (v: TaskPriority) => void;
}

export function PriorityToggle({ value, onChange }: PriorityToggleProps) {
  const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(value) + 1) % PRIORITY_CYCLE.length];
  const cfg = value ? PRIORITY_CONFIG[value] : null;
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      title={`Priority: ${value ?? "none"} (click to change)`}
      className={cn(
        "h-9 w-9 shrink-0 rounded-lg border text-xs font-bold transition-colors cursor-pointer",
        cfg ? cfg.btn : "border-border/60 text-muted-foreground hover:border-border",
      )}
    >
      {cfg ? cfg.label : "—"}
    </button>
  );
}
