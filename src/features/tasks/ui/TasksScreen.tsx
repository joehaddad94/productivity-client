"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Calendar,
  RefreshCw,
  GripVertical,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/components/ui/utils";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { useTasksScreen } from "../hooks/useTasksScreen";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDrawer } from "./TaskDrawer";
import type { CreateTaskBody } from "@/lib/api/tasks-api";

const PRIORITY_PILL: Record<string, string> = {
  low: "text-gray-500 bg-gray-100 dark:bg-gray-800",
  medium: "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  high: "text-red-600 bg-red-50 dark:bg-red-950/50",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

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
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = !isCompleted && !!task.dueDate && task.dueDate.slice(0, 10) < todayStr;

  return (
    <>
      <div
        data-testid="task-row"
        draggable={!isSelectMode && depth === 0}
        onDragStart={(e) => { e.stopPropagation(); onDragStart?.(task.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver?.(task.id); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop?.(task.id); }}
        style={depth > 0 ? { marginLeft: `${depth * 20}px` } : undefined}
        className={cn(
          "group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer",
          isDragOver && "bg-primary/5 ring-1 ring-primary/30",
          isSelected && "bg-primary/5",
          !isDragOver && !isSelected && "hover:bg-muted/40",
          depth > 0 && "mt-0.5",
        )}
        onClick={() => isSelectMode ? onToggleSelect?.(task.id) : onSelect(task)}
      >
        {/* Drag handle */}
        {!isSelectMode && depth === 0 && (
          <GripVertical className="size-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab -ml-1" />
        )}

        {/* Select or expand + checkbox */}
        {isSelectMode ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }} className="text-primary shrink-0">
            {isSelected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {hasSubtasks ? (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id); }}
                className="text-muted-foreground hover:text-foreground"
              >
                {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(task.id, !!checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full"
            />
          </div>
        )}

        {/* Title */}
        <span className={cn(
          "flex-1 text-sm truncate",
          isCompleted && "line-through text-muted-foreground",
        )}>
          {task.title}
        </span>

        {/* Meta */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {task.priority && (
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium", PRIORITY_PILL[task.priority])}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500" : "text-muted-foreground")}>
              <Calendar className="size-3" />
              {task.dueDate.slice(0, 10)}
              {task.dueTime && <span>at {task.dueTime}</span>}
            </span>
          )}
          {task.recurrenceRule && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal gap-0.5">
              <RefreshCw className="size-2.5" />
              {task.recurrenceRule.charAt(0) + task.recurrenceRule.slice(1).toLowerCase()}
            </Badge>
          )}
          {hasSubtasks && (
            <span className="text-[11px] text-muted-foreground">
              {task.subtasks!.filter((s) => s.status === "completed").length}/{task.subtasks!.length}
            </span>
          )}
        </div>

        {/* Delete */}
        <button
          title="Delete task"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {hasSubtasks && expanded && task.subtasks!.map((sub) => (
        <TaskRow
          key={sub.id}
          task={sub}
          depth={depth + 1}
          expanded={false}
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

function EmptyState({ message, onAdd }: { message: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <CheckSquare className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="size-3.5" />
        Create a task
      </Button>
    </div>
  );
}

export function TasksScreen() {
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    workspaceId,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
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
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleBulkComplete,
    handleBulkDelete,
    handleToggleSelect,
    handleToggle,
    handleToggleExpand,
    handleDelete,
    handleLoadMore,
  } = useTasksScreen();

  function handleCreate(body: CreateTaskBody) {
    createMutation.mutate(body);
  }

  function handleSelectTask(task: Task) {
    setDrawerTask(task);
    setDrawerOpen(true);
  }

  function handleSaveDrawer(id: string, body: Parameters<typeof updateMutation.mutate>[0]["body"]) {
    updateMutation.mutate({ id, body }, {
      onSuccess: (updated) => {
        if (updated) setDrawerTask(updated);
        toast.success("Task updated");
      },
    });
  }

  function handleDeleteDrawer(id: string) {
    handleDelete(id);
    setDrawerOpen(false);
  }

  const TaskList = ({ items, tab }: { items: Task[]; tab: string }) => (
    <div className="mt-3">
      {items.length === 0 ? (
        <EmptyState
          message={isFiltered ? `No ${tab} tasks match your filters` : `No ${tab} tasks yet`}
          onAdd={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-0.5">
          {items.map((task) => (
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
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <ScreenSkeleton variant="tasks" />;
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setIsSelectMode((p) => !p); setSelectedIds(new Set()); }}
              disabled={!workspaceId}
            >
              {isSelectMode ? "Cancel" : "Select"}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
              <Plus className="size-3.5" />
              New task
            </Button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <SearchInput
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
            className="flex-1"
          />
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
            <SelectTrigger className="w-36 h-8 text-xs">
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

        {/* Bulk bar */}
        {isSelectMode && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={handleBulkComplete} disabled={bulkMutation.isPending}>
                Mark complete
              </Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleBulkDelete} disabled={bulkMutation.isPending}>
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-destructive">Failed to load tasks</p>}

        {/* Tabs */}
        {!error && (
          <Tabs defaultValue="pending">
            <TabsList className="h-9 bg-muted/40 border border-border/50 p-0.5 rounded-lg">
              <TabsTrigger value="pending" className="text-xs h-8 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Pending
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">{pendingTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs h-8 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                In Progress
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">{inProgressTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs h-8 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Completed
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">{completedTasks.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending"><TaskList items={pendingTasks} tab="pending" /></TabsContent>
            <TabsContent value="in_progress"><TaskList items={inProgressTasks} tab="in progress" /></TabsContent>
            <TabsContent value="completed"><TaskList items={completedTasks} tab="completed" /></TabsContent>
          </Tabs>
        )}

        {/* Load more */}
        {!error && tasks.length < total && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-muted-foreground">
              Load more ({tasks.length} / {total})
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      <TaskDrawer
        task={drawerTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveDrawer}
        onDelete={handleDeleteDrawer}
        onToggleSubtask={handleToggle}
        workspaceId={workspaceId}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
