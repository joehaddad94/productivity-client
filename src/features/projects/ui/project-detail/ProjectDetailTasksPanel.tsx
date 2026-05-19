"use client";

import { Check, Loader2, Plus } from "lucide-react";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { TaskCard } from "@/app/components/TaskCard";
import { cn } from "@/app/components/ui/utils";
import { activeTaskStatuses, taskStatusVisual } from "@/features/tasks/lib/taskStatusHelpers";
import type { UseMutationResult } from "@tanstack/react-query";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";

type UpdateTaskMutate = UseMutationResult<
  Task,
  Error,
  { id: string; body: UpdateTaskBody },
  unknown
>["mutate"];

export function ProjectDetailTasksPanel({
  tasks,
  tasksLoading,
  tasksTotal,
  tasksLoadedCount,
  onLoadMore,
  hideCompleted,
  setHideCompleted,
  selectedStatusIds,
  toggleStatusFilter,
  newTaskTitle,
  setNewTaskTitle,
  handleAddTask,
  createTaskPending,
  isSelectMode,
  selectedIds,
  handleToggleSelect,
  onBulkDeleteRequest,
  bulkTaskPending,
  updateTaskMutate,
  openTask,
  taskStatuses,
}: {
  tasks: Task[];
  taskStatuses: TaskStatusDefinition[];
  tasksLoading: boolean;
  tasksTotal: number;
  tasksLoadedCount: number;
  onLoadMore: () => void;
  hideCompleted: boolean;
  setHideCompleted: (v: boolean) => void;
  selectedStatusIds: Set<string>;
  toggleStatusFilter: (id: string) => void;
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  handleAddTask: () => void;
  createTaskPending: boolean;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  handleToggleSelect: (id: string) => void;
  onBulkDeleteRequest: () => void;
  bulkTaskPending: boolean;
  updateTaskMutate: UpdateTaskMutate;
  openTask: (task: Task) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a task and press Enter…"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSelectMode && handleAddTask()}
          disabled={createTaskPending || isSelectMode}
          className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
        />
        <Button
          variant="outline"
          className="shrink-0 h-9"
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim() || createTaskPending || isSelectMode}
        >
          {createTaskPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tasks">
        <button
          type="button"
          onClick={() => setHideCompleted(!hideCompleted)}
          aria-pressed={hideCompleted}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border cursor-pointer transition-colors",
            hideCompleted
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center justify-center size-3.5 rounded-sm border",
              hideCompleted ? "bg-primary border-primary text-primary-foreground" : "border-border",
            )}
          >
            {hideCompleted && <Check className="size-3" />}
          </span>
          Hide completed
        </button>

        {activeTaskStatuses(taskStatuses).map((status) => {
          const visual = taskStatusVisual(status.id, taskStatuses);
          const active = selectedStatusIds.has(status.id);
          return (
            <button
              key={status.id}
              type="button"
              onClick={() => toggleStatusFilter(status.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-all",
                active
                  ? "opacity-100"
                  : "opacity-50 hover:opacity-80",
              )}
              style={active && visual.color ? {
                color: visual.color,
                borderColor: visual.color + "66",
                backgroundColor: visual.color + "12",
              } : undefined}
            >
              <span
                className={cn("size-1.5 rounded-full shrink-0", !visual.color && visual.dot)}
                style={visual.color ? { backgroundColor: visual.color } : undefined}
              />
              {status.name}
            </button>
          );
        })}
      </div>

      {isSelectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={onBulkDeleteRequest}
            disabled={bulkTaskPending}
          >
            {bulkTaskPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Delete
          </Button>
        </div>
      )}

      {tasksLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {(hideCompleted || selectedStatusIds.size > 0) && tasksLoadedCount > 0
              ? "No tasks match your filters"
              : "No tasks yet"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {(hideCompleted || selectedStatusIds.size > 0) && tasksLoadedCount > 0
              ? "Try adjusting the filters above"
              : "Add a task above to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                taskStatuses={taskStatuses}
                onStatusChange={(id, status) =>
                  updateTaskMutate({
                    id,
                    body: { status },
                  })
                }
                selectionMode={isSelectMode}
                selected={selectedIds.has(task.id)}
                onToggleSelect={handleToggleSelect}
                onSelect={openTask}
              />
            ))}
          </div>
          {tasksLoadedCount < tasksTotal && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-muted-foreground">
                Load more ({tasksLoadedCount} / {tasksTotal})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
