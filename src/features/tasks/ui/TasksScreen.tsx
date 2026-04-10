"use client";

import { useState } from "react";
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  Flag,
  Calendar,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import { useTasksScreen } from "../hooks/useTasksScreen";
import { PRIORITY_COLORS, type TaskFormData } from "../model/types";

function LinkedNotesSection({
  workspaceId,
  taskId,
  taskTitle,
}: {
  workspaceId: string | null;
  taskId: string;
  taskTitle: string;
}) {
  const { data: notesPage, isLoading } = useNotesQuery(workspaceId, { taskId, limit: 10 });
  const notes = notesPage?.notes ?? [];

  const createNoteMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: () => {},
    onError: () => {},
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <FileText className="size-3.5" />
          Linked Notes {notes.length > 0 && <span className="text-gray-400">({notes.length})</span>}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          disabled={createNoteMutation.isPending || !workspaceId}
          onClick={() =>
            createNoteMutation.mutate({
              title: `Note for: ${taskTitle}`,
              tags: [],
              taskId,
            })
          }
        >
          {createNoteMutation.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3 mr-1" />
          )}
          New
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="size-4 animate-spin text-gray-400" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">No notes linked to this task.</p>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="text-xs flex items-center gap-1.5 px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-800"
            >
              <FileText className="size-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{note.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  depth = 0,
  expanded,
  onToggleExpand,
  onToggle,
  onSelect,
  onDelete,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  task: Task;
  depth?: number;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  isDragOver?: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
}) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isCompleted = task.status === "completed";

  return (
    <>
      <div
        data-testid="task-row"
        draggable={!isSelectMode && depth === 0}
        onDragStart={(e) => { e.stopPropagation(); onDragStart?.(task.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver?.(task.id); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop?.(task.id); }}
        className={cn(
          "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm",
          isDragOver && "border-primary border-dashed bg-primary/5",
          !isDragOver && isSelected
            ? "bg-primary/10 dark:bg-primary/20 border-primary/40 border-l-4 border-l-primary"
            : !isDragOver && isCompleted
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-400"
            : !isDragOver && "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 hover:shadow-md",
          depth > 0 && "ml-6 mt-1"
        )}
        onClick={() => isSelectMode ? onToggleSelect?.(task.id) : onSelect(task)}
      >
        {isSelectMode ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }}
            className="mt-0.5 text-primary"
          >
            {isSelected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-gray-400" />}
          </button>
        ) : (
          <>
            {hasSubtasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(task.id);
                }}
                className="mt-0.5 text-gray-400"
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            )}
            {!hasSubtasks && <div className="w-3.5" />}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(task.id, !!checked)}
              className="mt-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          </>
        )}

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              isCompleted && "line-through text-emerald-700 dark:text-emerald-400"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="size-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn("text-xs", PRIORITY_COLORS[task.priority])}
              >
                <Flag className="size-3 mr-1" />
                {task.priority}
              </Badge>
            )}
            {hasSubtasks && (
              <span className="text-xs text-gray-400">
                {task.subtasks?.filter((s) => s.status === "completed").length}/
                {task.subtasks?.length} subtasks
              </span>
            )}
          </div>
        </div>

        <button
          title="Delete task"
          aria-label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition-opacity"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {hasSubtasks && expanded &&
        task.subtasks!.map((sub) => (
          <TaskRow
            key={sub.id}
            task={sub}
            depth={depth + 1}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggle={onToggle}
            onSelect={onSelect}
            onDelete={onDelete}
            isSelectMode={isSelectMode}
            isSelected={false}
            onToggleSelect={onToggleSelect}
          />
        ))}
    </>
  );
}

function CreateTaskForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "none">("none");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit({
      title: title.trim(),
      priority: priority === "none" ? undefined : priority,
      dueDate: dueDate || undefined,
    });
    setTitle("");
    setPriority("none");
    setDueDate("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <Label htmlFor="task-title" className="text-xs font-medium">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          autoFocus
          disabled={isPending}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium">Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as typeof priority)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="due-date" className="text-xs font-medium">Due Date</Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isPending}
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
          Create
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function TasksScreen() {
  const {
    workspaceId,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    showCreate,
    setShowCreate,
    selectedTask,
    showDetail,
    setShowDetail,
    tasks,
    total,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    isLoading,
    error,
    isFiltered,
    expandedIds,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
    dragOverId,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkMutation,
    handleCreate,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleBulkComplete,
    handleBulkDelete,
    handleToggleSelect,
    handleToggle,
    handleToggleExpand,
    handleDelete,
    handleSelectTask,
    handleLoadMore,
  } = useTasksScreen();

  const TaskList = ({ items, tab }: { items: Task[]; tab: string }) => (
    <div className="space-y-2 mt-4">
      {items.length === 0 ? (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          {isFiltered ? `No ${tab} tasks match your filters` : `No ${tab} tasks`}
        </p>
      ) : (
        items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedIds.has(task.id) ? false : true}
            onToggleExpand={handleToggleExpand}
            onToggle={handleToggle}
            onSelect={handleSelectTask}
            onDelete={handleDelete}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(task.id)}
            onToggleSelect={handleToggleSelect}
            isDragOver={dragOverId === task.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your tasks and stay productive
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isSelectMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setIsSelectMode((p) => !p);
                  setSelectedIds(new Set());
                }}
                disabled={!workspaceId}
              >
                <CheckSquare className="size-4 mr-2" />
                {isSelectMode ? "Cancel" : "Select"}
              </Button>
              <Button onClick={() => setShowCreate((p) => !p)} disabled={!workspaceId}>
                <Plus className="size-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          {isSelectMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkComplete}
                  disabled={bulkMutation.isPending}
                >
                  {bulkMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkMutation.isPending}
                >
                  {bulkMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Delete
                </Button>
              </div>
            </div>
          )}

          {showCreate && (
            <CreateTaskForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              isPending={createMutation.isPending}
            />
          )}

          <div className="flex gap-3">
            <SearchInput
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
              className="flex-1"
            />
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <p className="text-center py-8 text-red-500 text-sm">Failed to load tasks</p>
          )}

          {!isLoading && !error && (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="pending">
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {pendingTasks.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in_progress">
                  In Progress
                  <Badge variant="secondary" className="ml-2">
                    {inProgressTasks.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  <Badge variant="secondary" className="ml-2">
                    {completedTasks.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <TaskList items={pendingTasks} tab="pending" />
              </TabsContent>
              <TabsContent value="in_progress">
                <TaskList items={inProgressTasks} tab="in-progress" />
              </TabsContent>
              <TabsContent value="completed">
                <TaskList items={completedTasks} tab="completed" />
              </TabsContent>
            </Tabs>
          )}

          {!isLoading && tasks.length < total && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load more ({tasks.length} / {total})
              </Button>
            </div>
          )}
        </div>

        {showDetail && selectedTask && (
          <div className="lg:w-96 fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-0 bg-white dark:bg-gray-900 lg:bg-transparent">
            <Card className="h-full lg:sticky lg:top-6 border-0 lg:border rounded-none lg:rounded-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Task Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Title</Label>
                  <Input
                    defaultValue={selectedTask.title}
                    onBlur={(e) => {
                      if (e.target.value !== selectedTask.title) {
                        updateMutation.mutate({
                          id: selectedTask.id,
                          body: { title: e.target.value },
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <Select
                    defaultValue={selectedTask.status}
                    onValueChange={(v) => {
                      updateMutation.mutate({
                        id: selectedTask.id,
                        body: { status: v as Task["status"] },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Priority</Label>
                  <Select
                    defaultValue={selectedTask.priority ?? "none"}
                    onValueChange={(v) => {
                      updateMutation.mutate({
                        id: selectedTask.id,
                        body: {
                          priority:
                            v === "none"
                              ? undefined
                              : (v as Exclude<Task["priority"], null>),
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Due Date</Label>
                  <Input
                    type="date"
                    defaultValue={
                      selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toISOString().split("T")[0]
                        : ""
                    }
                    onBlur={(e) => {
                      updateMutation.mutate({
                        id: selectedTask.id,
                        body: { dueDate: e.target.value || undefined },
                      });
                    }}
                  />
                </div>

                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Subtasks ({selectedTask.subtasks.filter((s) => s.status === "completed").length}/
                      {selectedTask.subtasks.length})
                    </Label>
                    <div className="space-y-1">
                      {selectedTask.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={sub.status === "completed"}
                            onCheckedChange={(checked) =>
                              handleToggle(sub.id, !!checked)
                            }
                          />
                          <span
                            className={
                              sub.status === "completed"
                                ? "line-through text-gray-400"
                                : ""
                            }
                          >
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <LinkedNotesSection
                  workspaceId={workspaceId}
                  taskId={selectedTask.id}
                  taskTitle={selectedTask.title}
                />

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(selectedTask.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
