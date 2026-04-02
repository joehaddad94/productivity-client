import { Calendar, Flag } from "lucide-react";
import type { Task } from "@/lib/types";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect?: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onSelect }: TaskCardProps) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    medium: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  const isCompleted = task.status === "completed" || task.completed === true;

  return (
    <div
      onClick={() => onSelect?.(task)}
      className={cn(
        "group p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm",
        isCompleted
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-400 dark:border-l-emerald-500 hover:shadow-md"
          : task.overdue
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 border-l-4 border-l-red-400 dark:border-l-red-500 hover:shadow-md"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium mb-2",
              isCompleted && "line-through text-emerald-700 dark:text-emerald-400"
            )}
          >
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {task.dueDate && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                task.overdue && !isCompleted
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              )}>
                <Calendar className="size-3" />
                <span>
                  {typeof task.dueDate === "string" && task.dueDate.includes("T")
                    ? new Date(task.dueDate).toLocaleDateString()
                    : task.dueDate}
                </span>
              </div>
            )}
            {task.priority && (
              <Badge variant="secondary" className={cn("text-xs", priorityColors[task.priority])}>
                <Flag className="size-3 mr-1" />
                {task.priority}
              </Badge>
            )}
            {task.status && (
              <Badge variant="outline" className="text-xs">
                {task.status}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
