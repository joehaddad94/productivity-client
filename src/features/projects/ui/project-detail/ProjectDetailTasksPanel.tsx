"use client";

import { Loader2, Plus } from "lucide-react";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { TaskCard } from "@/app/components/TaskCard";
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
  newTaskTitle,
  setNewTaskTitle,
  handleAddTask,
  createTaskPending,
  isSelectMode,
  selectedIds,
  handleToggleSelect,
  handleBulkDelete,
  bulkTaskPending,
  onBulkDeleteDone,
  updateTaskMutate,
  openTask,
  taskStatuses,
}: {
  tasks: Task[];
  taskStatuses: TaskStatusDefinition[];
  tasksLoading: boolean;
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  handleAddTask: () => void;
  createTaskPending: boolean;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  handleToggleSelect: (id: string) => void;
  handleBulkDelete: (onDone?: () => void) => void;
  bulkTaskPending: boolean;
  onBulkDeleteDone: () => void;
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

      {isSelectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => handleBulkDelete(onBulkDeleteDone)}
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
          <p className="text-sm text-muted-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground/60">Add a task above to get started</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
