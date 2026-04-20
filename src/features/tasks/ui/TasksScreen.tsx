"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Calendar,
  RefreshCw,
  GripVertical,
  CheckSquare,
  Square,
  ListChecks,
} from "lucide-react";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { isTaskStatusTerminal } from "../lib/taskStatusHelpers";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/components/ui/utils";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { useTasksScreen } from "../hooks/useTasksScreen";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDrawer } from "./TaskDrawer";
import { TaskStatusesSettings } from "./TaskStatusesSettings";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
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
  onStatusChange,
  onSelect,
  onDelete,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  getProjectName,
  taskStatuses,
}: {
  task: Task;
  depth?: number;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onSelect: (task: Task) => void;
  onDelete: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  isDragOver?: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
  getProjectName: (projectId: string | null | undefined) => string | null;
  taskStatuses: TaskStatusDefinition[];
}) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const projectName = getProjectName(task.projectId);
  const isCompleted = isTaskStatusTerminal(task.status, taskStatuses);
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
        style={depth > 0 ? { marginLeft: `${depth * 60}px` } : undefined}
        className={cn(
          "group flex items-center gap-2 px-2 rounded-lg transition-colors cursor-pointer",
          depth === 0 ? "py-2" : "py-1",
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

        {/* Select checkbox (select mode) / expand chevron (normal mode) */}
        {isSelectMode ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }} className="text-primary shrink-0">
            {isSelected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
          </button>
        ) : depth > 0 ? (
          /* Subtask: binary checkbox */
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(task.id, checked === true)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
        ) : (
          /* Parent task: expand chevron only */
          hasSubtasks ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id); }}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )
        )}

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "truncate block",
            depth === 0 ? "text-sm" : "text-xs text-muted-foreground",
            isCompleted && "line-through opacity-50",
          )}>
            {task.title}
          </span>
          {task.description && depth === 0 && (
            <span className="text-xs text-muted-foreground/70 truncate block">{task.description}</span>
          )}
        </div>

        {/* Meta — hidden on subtask rows */}
        <div className={cn("flex min-w-0 flex-wrap items-center justify-end gap-1.5 shrink-0 sm:flex-nowrap", depth > 0 && "hidden")}>
          {/* Status pill */}
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v)}>
              <SelectTrigger className={cn(
                "h-auto rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none gap-1.5 focus-visible:ring-0 w-auto [&_svg]:size-3 [&_svg]:opacity-40",
                isCompleted
                  ? "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5"
                  : "border-border/60 text-muted-foreground",
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {taskStatuses.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "size-1.5 rounded-full shrink-0",
                        isTaskStatusTerminal(s.id, taskStatuses) ? "bg-green-500" : "bg-muted-foreground/40",
                      )} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {task.projectId && projectName && (
            <Link
              href={`/projects/${task.projectId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-muted-foreground hover:text-foreground truncate max-w-[140px]"
            >
              {projectName}
            </Link>
          )}
          {task.projectId && !projectName && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">Unknown project</span>
          )}
          {!task.projectId && (
            <span className="text-[11px] text-muted-foreground/70 truncate max-w-[140px]" title="Not linked to a project">
              No project
            </span>
          )}
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
              {task.subtasks!.filter((s) => isTaskStatusTerminal(s.status, taskStatuses)).length}/
              {task.subtasks!.length}
            </span>
          )}
        </div>

        {/* Delete — parent tasks only */}
        {depth === 0 && (
          <button
            title="Delete task"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {hasSubtasks && expanded && task.subtasks!.map((sub) => (
        <TaskRow
          key={sub.id}
          task={sub}
          depth={depth + 1}
          expanded={false}
          onToggleExpand={onToggleExpand}
          onToggle={onToggle}
          onStatusChange={onStatusChange}
          onSelect={onSelect}
          onDelete={onDelete}
          isSelectMode={isSelectMode}
          isSelected={false}
          onToggleSelect={onToggleSelect}
          getProjectName={getProjectName}
          taskStatuses={taskStatuses}
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
  const [projectFilterOpen, setProjectFilterOpen] = useState(false);
  const [statusesSheetOpen, setStatusesSheetOpen] = useState(false);
  const savedExpandedIds = useRef<Set<string>>(new Set());

  const {
    workspaceId,
    searchQuery,
    setSearchQuery,
    filterProjectId,
    setFilterProjectId,
    filterPriority,
    setFilterPriority,
    projectsForPicker,
    projectsLoading,
    tasks,
    total,
    taskStatuses,
    statusColumns,
    isLoading,
    error,
    isFiltered,
    expandedIds,
    setExpandedIds,
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

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsForPicker) {
      m.set(p.id, p.name);
    }
    return m;
  }, [projectsForPicker]);

  const projectFilterLabel =
    filterProjectId === "all"
      ? "All projects"
      : projectNameById.get(filterProjectId) ?? "Project";

  const [activeStatusTab, setActiveStatusTab] = useState("");
  useEffect(() => {
    const ids = statusColumns.map((c) => c.status.id);
    if (ids.length === 0) return;
    if (!activeStatusTab || !ids.includes(activeStatusTab)) {
      setActiveStatusTab(ids[0]!);
    }
  }, [statusColumns, activeStatusTab]);

  function handleCreate(body: CreateTaskBody) {
    createMutation.mutate(body);
  }

  function handleSelectTask(task: Task) {
    setDrawerTask(task);
    setDrawerOpen(true);
  }

  function handleStatusChange(id: string, status: string) {
    updateMutation.mutate({ id, body: { status } });
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
              onStatusChange={handleStatusChange}
              onSelect={handleSelectTask}
              onDelete={handleDelete}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(task.id)}
              onToggleSelect={handleToggleSelect}
              isDragOver={dragOverId === task.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              getProjectName={(id) => (id ? projectNameById.get(id) ?? null : null)}
              taskStatuses={taskStatuses}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <ScreenLoader variant="app" />;
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setStatusesSheetOpen(true)}
              disabled={!workspaceId}
              aria-label="Edit task statuses"
            >
              <ListChecks className="size-3.5" />
              Statuses
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="sm:hidden size-8"
              onClick={() => setStatusesSheetOpen(true)}
              disabled={!workspaceId}
              aria-label="Edit task statuses"
            >
              <ListChecks className="size-3.5" />
            </Button>
            <Button
              variant={isSelectMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                if (!isSelectMode) {
                  // Entering select mode: save current state, collapse all tasks with subtasks
                  savedExpandedIds.current = new Set(expandedIds);
                  const idsWithSubtasks = new Set(
                    tasks.filter((t) => t.subtasks && t.subtasks.length > 0).map((t) => t.id)
                  );
                  setExpandedIds(idsWithSubtasks);
                } else {
                  // Exiting select mode: restore previous expanded state
                  setExpandedIds(savedExpandedIds.current);
                  setSelectedIds(new Set());
                }
                setIsSelectMode((p) => !p);
              }}
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
        <div className="flex flex-wrap gap-2">
          <SearchInput
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
            className="flex-1 min-w-[12rem]"
          />
          <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={projectFilterOpen}
                aria-label="Filter by project"
                disabled={!workspaceId || projectsLoading}
                className="w-[min(100%,11rem)] sm:w-44 h-8 justify-between font-normal text-xs px-3"
              >
                <span className="truncate">{projectFilterLabel}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] max-w-sm p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search projects…" className="h-9" />
                <CommandList className="max-h-60">
                  <CommandEmpty>No project found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all projects"
                      className="cursor-pointer"
                      onSelect={() => {
                        setFilterProjectId("all");
                        setProjectFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          filterProjectId === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      All projects
                    </CommandItem>
                    {projectsForPicker.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.name} ${p.id}`}
                        className="cursor-pointer"
                        onSelect={() => {
                          setFilterProjectId(p.id);
                          setProjectFilterOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            filterProjectId === p.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{p.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
        {!error && statusColumns.length > 0 && (
          <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="min-w-0">
            <TabsList className="flex h-auto min-h-9 w-full flex-wrap gap-0.5 bg-muted/40 border border-border/50 p-0.5 rounded-lg sm:flex-nowrap sm:overflow-x-auto">
              {statusColumns.map(({ status: s, tasks: colTasks }) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="cursor-pointer text-xs h-8 shrink-0 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm max-w-[10rem]"
                >
                  <span className="truncate">{s.name}</span>
                  <Badge variant="secondary" className="ml-1.5 shrink-0 text-[10px] h-4 px-1.5">
                    {colTasks.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {statusColumns.map(({ status: s, tasks: colTasks }) => (
              <TabsContent key={s.id} value={s.id} className="min-w-0">
                <TaskList items={colTasks} tab={s.name} />
              </TabsContent>
            ))}
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
        projects={projectsForPicker}
        defaultProjectId={filterProjectId === "all" ? undefined : filterProjectId}
      />

      <TaskDrawer
        task={drawerTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveDrawer}
        onDelete={handleDeleteDrawer}
        onToggleSubtask={handleToggle}
        workspaceId={workspaceId}
        taskStatuses={taskStatuses}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <Sheet open={statusesSheetOpen} onOpenChange={setStatusesSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <SheetHeader className="shrink-0 space-y-1 border-b border-border/60 p-4 pb-3 text-left">
            <SheetTitle>Task statuses</SheetTitle>
            <SheetDescription>
              Columns and check-off behavior for this workspace. The server must implement{" "}
              <code className="rounded bg-muted px-1 text-[11px]">/workspaces/…/task-statuses</code> for changes to persist.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <TaskStatusesSettings hideTitle />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
