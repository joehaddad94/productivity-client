"use client";

import { useState } from "react";
import { Plus, X, ChevronDown, ChevronRight, Loader2, Trash2, Flag, Calendar } from "lucide-react";
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
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "@/app/hooks/useTasksApi";
import { cn } from "@/app/components/ui/utils";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function TaskRow({
  task,
  depth = 0,
  onToggle,
  onSelect,
  onDelete,
}: {
  task: Task;
  depth?: number;
  onToggle: (id: string, completed: boolean) => void;
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isCompleted = task.status === "completed";

  return (
    <>
      <div
        data-testid="task-row"
        className={cn(
          "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm",
          isCompleted
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-400"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 hover:shadow-md",
          depth > 0 && "ml-6 mt-1"
        )}
        onClick={() => onSelect(task)}
      >
        {hasSubtasks && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
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
            onToggle={onToggle}
            onSelect={onSelect}
            onDelete={onDelete}
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
  onSubmit: (data: { title: string; priority?: "low" | "medium" | "high"; dueDate?: string }) => void;
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

export function Tasks() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: tasks = [], isLoading, error } = useTasksQuery(workspaceId, {
    search: searchQuery || undefined,
    priority: filterPriority === "all" ? undefined : filterPriority || undefined,
  });

  const createMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => {
      setShowCreate(false);
      toast.success("Task created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteTaskMutation(workspaceId, {
    onSuccess: () => toast.success("Task deleted"),
    onError: (err) => toast.error(err.message),
  });

  const handleToggle = (id: string, completed: boolean) => {
    updateMutation.mutate({
      id,
      body: { status: completed ? "completed" : "pending" },
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    deleteMutation.mutate(id);
    if (selectedTask?.id === id) setShowDetail(false);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const TaskList = ({ items }: { items: Task[] }) => (
    <div className="space-y-2 mt-4">
      {items.length === 0 ? (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No tasks here
        </p>
      ) : (
        items.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={handleToggle}
            onSelect={handleSelectTask}
            onDelete={handleDelete}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your tasks and stay productive
              </p>
            </div>
            <Button onClick={() => setShowCreate((p) => !p)} disabled={!workspaceId}>
              <Plus className="size-4 mr-2" />
              Add Task
            </Button>
          </div>

          {showCreate && (
            <CreateTaskForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreate(false)}
              isPending={createMutation.isPending}
            />
          )}

          {/* Search + Filter */}
          <div className="flex gap-3">
            <SearchInput
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
              className="flex-1"
            />
            <Select value={filterPriority} onValueChange={setFilterPriority}>
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
                <TaskList items={pendingTasks} />
              </TabsContent>
              <TabsContent value="in_progress">
                <TaskList items={inProgressTasks} />
              </TabsContent>
              <TabsContent value="completed">
                <TaskList items={completedTasks} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Detail Panel */}
        {showDetail && selectedTask && (
          <div className="lg:w-96 fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-0 bg-white dark:bg-gray-900 lg:bg-transparent">
            <Card className="h-full lg:sticky lg:top-6 border-0 lg:border rounded-none lg:rounded-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Task Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetail(false)}
                  >
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
