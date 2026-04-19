import { Calendar, CheckSquare, RefreshCw, Square } from "lucide-react";
import type { Task } from "@/lib/types";
import { Checkbox } from "./ui/checkbox";
import { cn } from "./ui/utils";

// Text-only color classes for the priority label. Keeping these in their own
// map avoids fragile runtime slicing of a combined bg+text class string and
// makes the classes statically detectable by Tailwind's JIT.
const PRIORITY_TEXT: Record<string, string> = {
  low: "text-gray-500 dark:text-gray-400",
  medium: "text-amber-700 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

interface TaskCardProps {
  task: Task;
  /** Completion toggle; omit when `showCheckbox` is false. */
  onToggle?: (id: string) => void;
  onSelect?: (task: Task) => void;
  /** When false, row opens details via `onSelect` (no inline complete checkbox). Default true. */
  showCheckbox?: boolean;
  /** Multi-select for bulk actions (e.g. delete). */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function TaskCard({
  task,
  onToggle,
  onSelect,
  showCheckbox = true,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = !isCompleted && !!task.dueDate && task.dueDate.slice(0, 10) < todayStr;

  const rowClick = () => {
    if (selectionMode) onToggleSelect?.(task.id);
    else onSelect?.(task);
  };

  return (
    <div
      data-testid="task-card"
      onClick={rowClick}
      className={cn(
        "group flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:border-border transition-colors cursor-pointer",
        isCompleted && "opacity-60",
        (onSelect || selectionMode) && "hover:bg-muted/40",
        selectionMode && selected && "bg-primary/5 border-primary/20",
      )}
    >
      {selectionMode ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(task.id);
          }}
          className="text-primary mt-0.5 shrink-0"
          aria-pressed={selected}
          aria-label={selected ? "Deselect task" : "Select task"}
        >
          {selected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
        </button>
      ) : showCheckbox ? (
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle?.(task.id)}
          className="mt-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {task.priority && (
            <span className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />
              <span className={cn("text-[11px] font-medium", PRIORITY_TEXT[task.priority])}>
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
