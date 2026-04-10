import { Calendar, RefreshCw } from "lucide-react";
import type { Task } from "@/lib/types";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  high: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect?: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onSelect }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = !isCompleted && !!task.dueDate && task.dueDate.slice(0, 10) < todayStr;

  return (
    <div
      onClick={() => onSelect?.(task)}
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:border-border transition-colors cursor-pointer",
        isCompleted && "opacity-60",
        onSelect && "hover:bg-muted/40",
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {task.priority && (
            <span className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
              <span className={cn("text-[11px] font-medium", PRIORITY_COLORS[task.priority].split(" ").slice(2).join(" "))}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </span>
          )}
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
              <Calendar className="size-3" />
              {task.dueDate.slice(0, 10)}
              {task.dueTime && <span>· {task.dueTime}</span>}
            </span>
          )}
          {task.recurrenceRule && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3" />
              {task.recurrenceRule.charAt(0) + task.recurrenceRule.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
