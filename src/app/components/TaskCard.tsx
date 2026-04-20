import { Calendar, CheckSquare, Loader2, RefreshCw, Square } from "lucide-react";
import type { Task } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";

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

const STATUS_STYLES: Record<string, { dot: string; label: string; badge: string }> = {
  pending:     { dot: "bg-muted-foreground/40", label: "Pending",     badge: "border-border/60 text-muted-foreground"                       },
  in_progress: { dot: "bg-blue-500",            label: "In progress", badge: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"  },
  completed:   { dot: "bg-green-500",           label: "Completed",   badge: "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5" },
};

interface TaskCardProps {
  task: Task;
  onToggle?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onSelect?: (task: Task) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function TaskCard({
  task,
  onToggle,
  onStatusChange,
  onSelect,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const isSaving = task.id.startsWith("temp_");
  const isCompleted = task.status === "completed";
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = !isCompleted && !!task.dueDate && task.dueDate.slice(0, 10) < todayStr;
  const statusCfg = STATUS_STYLES[task.status ?? "pending"] ?? STATUS_STYLES.pending;

  const rowClick = () => {
    if (isSaving) return;
    if (selectionMode) onToggleSelect?.(task.id);
    else onSelect?.(task);
  };

  return (
    <div
      data-testid="task-card"
      onClick={rowClick}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:border-border transition-colors",
        isSaving ? "opacity-60 cursor-default" : "cursor-pointer",
        isCompleted && "opacity-60",
        !isSaving && (onSelect || selectionMode) && "hover:bg-muted/40",
        !isSaving && selectionMode && selected && "bg-primary/5 border-primary/20",
      )}
    >
      {selectionMode && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }}
          className="text-primary shrink-0"
          aria-pressed={selected}
          aria-label={selected ? "Deselect task" : "Select task"}
        >
          {selected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {(task.priority || task.dueDate || task.recurrenceRule) && (
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
        )}
      </div>

      {/* Saving spinner while temp ID is unresolved */}
      {isSaving && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />}

      {/* Status badge — right side */}
      {!isSaving && onStatusChange && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <Select
            value={task.status ?? "pending"}
            onValueChange={(value) => onStatusChange(task.id, value)}
          >
            <SelectTrigger className={cn(
              "h-auto rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none gap-1.5 focus-visible:ring-0 w-auto [&_svg]:size-3 [&_svg]:opacity-40",
              statusCfg.badge,
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="pending">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  Pending
                </span>
              </SelectItem>
              <SelectItem value="in_progress">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                  In progress
                </span>
              </SelectItem>
              <SelectItem value="completed">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
                  Completed
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
