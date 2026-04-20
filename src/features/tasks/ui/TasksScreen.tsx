"use client";

import { ProjectPicker, type ProjectOption } from "./ProjectPicker";
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
  ArrowUpDown,
  AlertCircle,
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

const COL_STATUS = "w-[108px]";
const COL_PRIORITY = "w-[72px]";
const COL_DUE = "w-[80px]";
const COL_PROJECT = "w-[116px]";
const COL_ICON = "w-10";

function StatusSelect({
  task,
  taskStatuses,
  onStatusChange,
  isCompleted,
}: {
  task: Task;
  taskStatuses: TaskStatusDefinition[];
  onStatusChange: (id: string, status: string) => void;
  isCompleted: boolean;
}) {
  return (
    <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v)}>
      <SelectTrigger className={cn(
        "h-auto rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none gap-1 focus-visible:ring-0 w-auto max-w-full [&_svg]:size-3 [&_svg]:opacity-40",
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
              <span className={cn("size-1.5 rounded-full shrink-0", isTaskStatusTerminal(s.id, taskStatuses) ? "bg-green-500" : "bg-muted-foreground/40")} />
              {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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
  projects,
  onProjectChange,
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
  projects: ProjectOption[];
  onProjectChange: (id: string, projectId: string | undefined) => void;
  taskStatuses: TaskStatusDefinition[];
}) {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
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
        style={depth > 0 ? { paddingLeft: `${depth * 20}px` } : undefined}
        className={cn(
          "group flex items-center transition-colors cursor-pointer",
          depth === 0
            ? "hover:bg-muted/30"
            : "hover:bg-muted/20",
          isDragOver && "bg-primary/5",
          isSelected && "bg-primary/5",
          isCompleted && depth === 0 && "opacity-60",
        )}
        onClick={() => isSelectMode ? onToggleSelect?.(task.id) : onSelect(task)}
      >
        {/* Icon column: drag + expand/select/checkbox */}
        <div className={cn(COL_ICON, "flex items-center justify-center shrink-0 py-2.5 gap-0.5")}>
          {isSelectMode ? (
            <button onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }} className="text-primary">
              {isSelected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
            </button>
          ) : depth > 0 ? (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(task.id, checked === true)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : hasSubtasks ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id); }}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          ) : (
            <span className="size-3.5" />
          )}
        </div>

        {/* Title column */}
        <div className="flex-1 min-w-0 py-2.5 pr-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {!isSelectMode && depth === 0 && (
              <GripVertical className="size-3 text-muted-foreground/25 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />
            )}
            <div className="flex-1 min-w-0">
              <span className={cn(
                "block truncate leading-snug",
                depth === 0 ? "text-sm font-medium" : "text-xs text-muted-foreground",
                isCompleted && "line-through opacity-50",
              )}>
                {task.title}
              </span>
              {task.description && depth === 0 && (
                <span className="text-xs text-muted-foreground/70 truncate block mt-0.5">{task.description}</span>
              )}
            </div>
            {/* Mobile: status pill inline */}
            {depth === 0 && (
              <div onClick={(e) => e.stopPropagation()} className="sm:hidden shrink-0">
                <StatusSelect task={task} taskStatuses={taskStatuses} onStatusChange={onStatusChange} isCompleted={isCompleted} />
              </div>
            )}
          </div>

          {/* Mobile metadata chips */}
          {depth === 0 && (
            <div className="sm:hidden flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 pl-4">
              {task.dueDate && (
                <span className={cn("flex items-center gap-1 text-[11px] font-medium", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                  <Calendar className="size-3 shrink-0" />
                  {task.dueDate.slice(0, 10).slice(5)}
                  {task.dueTime && <span className="opacity-70"> · {task.dueTime}</span>}
                </span>
              )}
              {task.priority && (
                <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", PRIORITY_PILL[task.priority])}>
                  {task.priority[0].toUpperCase() + task.priority.slice(1)}
                </span>
              )}
              {hasSubtasks && (() => {
                const done = task.subtasks!.filter((s) => isTaskStatusTerminal(s.status, taskStatuses)).length;
                const total = task.subtasks!.length;
                const pct = Math.round((done / total) * 100);
                return (
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{done}/{total}</span>
                  </div>
                );
              })()}
              {task.recurrenceRule && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <RefreshCw className="size-3" />
                  {task.recurrenceRule[0] + task.recurrenceRule.slice(1).toLowerCase()}
                </span>
              )}
              {task.projectId && (
                <span className="text-[11px] text-muted-foreground/70 truncate max-w-[120px]">
                  {projects.find((p) => p.id === task.projectId)?.name}
                </span>
              )}
            </div>
          )}

          {/* Subtask progress — mobile */}
          {depth === 0 && hasSubtasks && (() => {
            const done = task.subtasks!.filter((s) => isTaskStatusTerminal(s.status, taskStatuses)).length;
            const total = task.subtasks!.length;
            const pct = Math.round((done / total) * 100);
            return (
              <div className="hidden sm:flex items-center gap-1.5 mt-1">
                <div className="w-12 h-0.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground/60">{done}/{total}</span>
              </div>
            );
          })()}
        </div>

        {/* Desktop: Status */}
        {depth === 0 ? (
          <div onClick={(e) => e.stopPropagation()} className={cn("hidden sm:flex items-center shrink-0 py-2.5 pr-3", COL_STATUS)}>
            <StatusSelect task={task} taskStatuses={taskStatuses} onStatusChange={onStatusChange} isCompleted={isCompleted} />
          </div>
        ) : (
          <div className={cn("hidden sm:block shrink-0", COL_STATUS)} />
        )}

        {/* Desktop: Priority */}
        <div className={cn("hidden sm:flex items-center shrink-0 py-2.5 pr-3", COL_PRIORITY)}>
          {depth === 0 && task.priority && (
            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", PRIORITY_PILL[task.priority])}>
              {task.priority[0].toUpperCase() + task.priority.slice(1)}
            </span>
          )}
        </div>

        {/* Desktop: Due */}
        <div className={cn("hidden sm:flex items-center shrink-0 py-2.5 pr-3", COL_DUE)}>
          {depth === 0 && task.dueDate && (
            <span className={cn("flex items-center gap-1 text-[11px] font-medium", isOverdue ? "text-red-500" : "text-muted-foreground")}>
              <Calendar className="size-3 shrink-0" />
              {task.dueDate.slice(0, 10).slice(5)}
            </span>
          )}
        </div>

        {/* Desktop: Project */}
        <div onClick={(e) => e.stopPropagation()} className={cn("hidden md:flex items-center shrink-0 py-2.5 pr-2", COL_PROJECT)}>
          {depth === 0 && (
            <ProjectPicker
              projects={projects}
              value={task.projectId ?? undefined}
              onChange={(pid) => onProjectChange(task.id, pid)}
              triggerClassName="h-auto border-0 shadow-none bg-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 font-normal w-full max-w-full"
            />
          )}
        </div>

        {/* Delete */}
        <div className={cn(COL_ICON, "flex items-center justify-center shrink-0 py-2.5")}>
          {depth === 0 && (
            <button
              title="Delete task"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
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
          projects={projects}
          onProjectChange={onProjectChange}
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
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "due" | "priority">("default");
  const [bulkProjectOpen, setBulkProjectOpen] = useState(false);
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

  function handleProjectChange(id: string, projectId: string | undefined) {
    updateMutation.mutate({ id, body: { projectId: projectId ?? null } });
  }

  function handleSelectAll(visibleTasks: Task[]) {
    const allIds = new Set(visibleTasks.map((t) => t.id));
    const allSelected = visibleTasks.every((t) => selectedIds.has(t.id));
    setSelectedIds(allSelected ? new Set() : allIds);
  }

  function handleBulkMoveProject(projectId: string | undefined) {
    const ids = Array.from(selectedIds);
    Promise.all(
      ids.map((id) => updateMutation.mutateAsync({ id, body: { projectId: projectId ?? null } }))
    ).then(() => {
      setSelectedIds(new Set());
      setBulkProjectOpen(false);
      toast.success(`Moved ${ids.length} task${ids.length !== 1 ? "s" : ""}`);
    }).catch(() => toast.error("Some tasks could not be moved"));
  }

  const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const todayStr = new Date().toISOString().slice(0, 10);

  const TaskList = ({ items, tab }: { items: Task[]; tab: string }) => {
    let visible = showOverdueOnly
      ? items.filter((t) => !!t.dueDate && t.dueDate.slice(0, 10) < todayStr)
      : items;

    if (sortBy === "due") {
      visible = [...visible].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sortBy === "priority") {
      visible = [...visible].sort(
        (a, b) => (PRIORITY_RANK[a.priority ?? ""] ?? 3) - (PRIORITY_RANK[b.priority ?? ""] ?? 3)
      );
    }

    return (
      <div className="mt-3">
        {visible.length === 0 ? (
          <EmptyState
            message={isFiltered || showOverdueOnly ? `No ${tab} tasks match your filters` : `No ${tab} tasks yet`}
            onAdd={() => setCreateOpen(true)}
          />
        ) : (
          <div className="space-y-0.5">
            {visible.map((task) => (
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
                projects={projectsForPicker}
                onProjectChange={handleProjectChange}
                taskStatuses={taskStatuses}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <ScreenLoader variant="app" />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hidden sm:inline-flex"
              onClick={() => setStatusesSheetOpen(true)}
              disabled={!workspaceId}
            >
              <ListChecks className="size-3.5" />
              Statuses
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground sm:hidden size-8"
              onClick={() => setStatusesSheetOpen(true)}
              disabled={!workspaceId}
              aria-label="Edit task statuses"
            >
              <ListChecks className="size-4" />
            </Button>
            <Button
              variant={isSelectMode ? "secondary" : "ghost"}
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                if (!isSelectMode) {
                  savedExpandedIds.current = new Set(expandedIds);
                  setExpandedIds(new Set(tasks.filter((t) => t.subtasks && t.subtasks.length > 0).map((t) => t.id)));
                } else {
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-border/50 sm:border-b-0 sm:border-r sm:flex-1">
            <SearchInput
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
              className="w-full h-7 border-0 bg-transparent shadow-none focus-within:ring-0 text-sm"
            />
          </div>
          {/* Filters — scrollable on mobile */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-none">
            <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  role="combobox"
                  disabled={!workspaceId || projectsLoading}
                  className={cn("h-7 text-xs px-2 font-normal gap-1 shrink-0", filterProjectId !== "all" && "text-foreground font-medium")}
                >
                  {projectFilterLabel}
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search projects…" className="h-9" />
                  <CommandList className="max-h-60">
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all projects" className="cursor-pointer" onSelect={() => { setFilterProjectId("all"); setProjectFilterOpen(false); }}>
                        <Check className={cn("size-4 shrink-0", filterProjectId === "all" ? "opacity-100" : "opacity-0")} />
                        All projects
                      </CommandItem>
                      {projectsForPicker.map((p) => (
                        <CommandItem key={p.id} value={`${p.name} ${p.id}`} className="cursor-pointer" onSelect={() => { setFilterProjectId(p.id); setProjectFilterOpen(false); }}>
                          <Check className={cn("size-4 shrink-0", filterProjectId === p.id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{p.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
              <SelectTrigger className={cn("h-7 text-xs border-0 bg-transparent shadow-none w-auto px-2 gap-1 font-normal shrink-0", filterPriority !== "all" && "font-medium text-foreground")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setShowOverdueOnly((v) => !v)}
              disabled={!workspaceId}
              className={cn(
                "flex items-center gap-1 h-7 px-2 rounded-md text-xs transition-colors shrink-0",
                showOverdueOnly ? "text-red-500 font-medium bg-red-500/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AlertCircle className="size-3.5" />
              Overdue
            </button>
            <div className="w-px h-4 bg-border/60 shrink-0 mx-1" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none w-auto px-2 gap-1 font-normal shrink-0">
                <ArrowUpDown className="size-3 opacity-50 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="default">Default order</SelectItem>
                <SelectItem value="due">By due date</SelectItem>
                <SelectItem value="priority">By priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Select all / bulk bar */}
        {isSelectMode && (() => {
          const currentColTasks = statusColumns.find((c) => c.status.id === activeStatusTab)?.tasks ?? [];
          const allSelected = currentColTasks.length > 0 && currentColTasks.every((t) => selectedIds.has(t.id));
          return (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <button
                type="button"
                onClick={() => handleSelectAll(currentColTasks)}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-70 transition-opacity shrink-0"
              >
                {allSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </button>
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap gap-2 ml-auto">
                  <Popover open={bulkProjectOpen} onOpenChange={setBulkProjectOpen}>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" disabled={updateMutation.isPending}>Move to project</Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-56" align="end" sideOffset={4}>
                      <Command>
                        <CommandInput placeholder="Search projects…" className="h-9" />
                        <CommandList className="max-h-52">
                          <CommandEmpty className="text-xs">No project found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="no project" className="cursor-pointer text-xs" onSelect={() => handleBulkMoveProject(undefined)}>No project</CommandItem>
                            {projectsForPicker.map((p) => (
                              <CommandItem key={p.id} value={`${p.name} ${p.id}`} className="cursor-pointer text-xs" onSelect={() => handleBulkMoveProject(p.id)}>
                                <span className="truncate">{p.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" variant="outline" onClick={handleBulkComplete} disabled={bulkMutation.isPending}>Mark complete</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleBulkDelete} disabled={bulkMutation.isPending}>Delete</Button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Error */}
        {error && <p className="text-sm text-destructive">Failed to load tasks</p>}

        {/* Tabs */}
        {!error && statusColumns.length > 0 && (
          <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="min-w-0">
            <TabsList className="flex h-9 w-full bg-transparent border-b border-border/50 rounded-none p-0 gap-0 justify-start overflow-x-auto">
              {statusColumns.map(({ status: s, tasks: colTasks }) => (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="cursor-pointer text-xs h-9 px-4 shrink-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-medium bg-transparent shadow-none"
                >
                  {s.name}
                  <span className={cn(
                    "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    activeStatusTab === s.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {colTasks.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {statusColumns.map(({ status: s, tasks: colTasks }) => (
              <TabsContent key={s.id} value={s.id} className="min-w-0 mt-3">
                <TaskList items={colTasks} tab={s.name} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Load more */}
        {!error && tasks.length < total && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-muted-foreground text-xs">
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
        projects={projectsForPicker}
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
