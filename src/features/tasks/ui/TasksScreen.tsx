"use client";

import { ProjectPicker, type ProjectOption } from "./ProjectPicker";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  X,
  PanelRight,
  Timer,
} from "lucide-react";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { isTaskStatusTerminal } from "../lib/taskStatusHelpers";
import { getSubtaskProgress } from "../lib/subtaskProgress";
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
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { cn } from "@/app/components/ui/utils";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { usePomodoroLink } from "@/app/components/pomodoro";
import { useTasksScreen } from "../hooks/useTasksScreen";
import { useDebounce } from "@/app/hooks/useDebounce";
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

function formatDate(isoDate: string, todayYear: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(year !== todayYear ? { year: "numeric" } : {}),
  });
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatFocus(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Module-level constants ────────────────────────────────────────────────────

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_PILL: Record<string, string> = {
  low: "text-gray-500 bg-gray-100 dark:bg-gray-800",
  medium: "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  high: "text-red-600 bg-red-50 dark:bg-red-950/50",
};

const COL_STATUS = "w-[108px]";
const COL_PRIORITY = "w-[72px]";
const COL_DUE = "w-[96px]";
const COL_PROJECT = "w-[116px]";
const COL_ICON = "w-10";
const COL_ACTIONS = "w-[76px]";

const FILTER_BTN =
  "inline-flex items-center gap-1 !h-7 px-2 rounded-md text-xs font-normal shrink-0 cursor-pointer transition-colors " +
  "text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-muted " +
  "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";

// ─── Flat row type for virtualized list ───────────────────────────────────────

type FlatRow =
  | { type: "task"; task: Task }
  | { type: "subtask"; task: Task };

function flattenVisible(tasks: Task[], collapsedIds: Set<string>): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const t of tasks) {
    rows.push({ type: "task", task: t });
    if (t.subtasks?.length && !collapsedIds.has(t.id)) {
      for (const sub of t.subtasks) rows.push({ type: "subtask", task: sub });
    }
  }
  return rows;
}

// ─── RowProjectPicker — lazy: mounts Command tree only when open ───────────────

const RowProjectPicker = memo(function RowProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = useMemo(() => projects.find((p) => p.id === value)?.name, [projects, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-muted/50 truncate max-w-full text-center transition-colors cursor-pointer"
        >
          {name ?? <span className="opacity-30">—</span>}
        </button>
      </PopoverTrigger>
      {open && (
        <PopoverContent className="w-52 p-0 border-border shadow-lg" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder="Search projects…" className="h-9" />
            <CommandList className="max-h-56">
              <CommandEmpty className="text-xs">No project found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="no project all" className="cursor-pointer text-xs" onSelect={() => { onChange(undefined); setOpen(false); }}>
                  No project
                </CommandItem>
                {projects.map((p) => (
                  <CommandItem key={p.id} value={`${p.name} ${p.id}`} className="cursor-pointer text-xs" onSelect={() => { onChange(p.id); setOpen(false); }}>
                    <span className="truncate">{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
});

// ─── StatusSelect — memoized ───────────────────────────────────────────────────

const StatusSelect = memo(function StatusSelect({
  task,
  taskStatuses,
  terminalIds,
  onStatusChange,
  isCompleted,
}: {
  task: Task;
  taskStatuses: TaskStatusDefinition[];
  terminalIds: Set<string>;
  onStatusChange: (id: string, status: string) => void;
  isCompleted: boolean;
}) {
  return (
    <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v)}>
      <SelectTrigger className={cn(
        "h-auto rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-none gap-1 focus-visible:ring-0 w-auto max-w-full [&_svg]:size-3 [&_svg]:opacity-40 cursor-pointer",
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
              <span className={cn("size-1.5 rounded-full shrink-0", terminalIds.has(s.id) ? "bg-green-500" : "bg-muted-foreground/40")} />
              {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

// ─── TaskRow — memoized ────────────────────────────────────────────────────────

const TaskRow = memo(function TaskRow({
  task,
  depth = 0,
  expanded,
  todayStr,
  terminalIds,
  onToggleExpand,
  onToggle,
  onStatusChange,
  onSelect,
  onDeleteRequest,
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
  isEditing = false,
  onEditStart,
  onEditSave,
  onEditCancel,
  isLinked = false,
  onLinkTimer,
}: {
  task: Task;
  depth?: number;
  expanded: boolean;
  todayStr: string;
  terminalIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onSelect: (task: Task) => void;
  onDeleteRequest: (id: string) => void;
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
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditSave?: (title: string) => void;
  onEditCancel?: () => void;
  isLinked?: boolean;
  onLinkTimer?: (id: string) => void;
}) {
  const hasSubtasks = !!task.subtasks?.length;
  const isCompleted = terminalIds.has(task.status);
  const isOverdue = !isCompleted && !!task.dueDate && task.dueDate.slice(0, 10) < todayStr;
  const todayYear = parseInt(todayStr.slice(0, 4), 10);

  const subtaskProgress = useMemo(
    () => (hasSubtasks ? getSubtaskProgress(task, taskStatuses) : null),
    [task, taskStatuses, hasSubtasks],
  );

  return (
    <div
      data-testid="task-row"
      draggable={!isSelectMode && depth === 0}
      onDragStart={(e) => { e.stopPropagation(); onDragStart?.(task.id); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver?.(task.id); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop?.(task.id); }}
      style={depth > 0 ? { paddingLeft: `${depth * 36}px` } : undefined}
      className={cn(
        "group flex items-center transition-colors",
        isSelectMode ? "cursor-pointer" : "cursor-default",
        depth === 0 ? "hover:bg-muted/30" : "hover:bg-muted/20 border-l-2 border-border/20",
        isDragOver && "bg-primary/5",
        isSelected && "bg-primary/5",
        isCompleted && depth === 0 && "opacity-60",
      )}
      onClick={() => isSelectMode ? onToggleSelect?.(task.id) : undefined}
    >
      {/* Icon column */}
      <div className={cn(COL_ICON, "flex items-center justify-center shrink-0 py-2.5")}>
        {isSelectMode ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }} className="text-primary cursor-pointer">
            {isSelected ? <CheckSquare className="size-4" /> : <Square className="size-4 text-muted-foreground" />}
          </button>
        ) : depth > 0 ? (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(task.id, checked === true)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : hasSubtasks ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id); }} className="text-muted-foreground hover:text-foreground cursor-pointer">
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
            {isEditing ? (
              <input
                autoFocus
                defaultValue={task.title}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); onEditSave?.((e.target as HTMLInputElement).value); }
                  if (e.key === "Escape") { e.preventDefault(); onEditCancel?.(); }
                }}
                onBlur={(e) => onEditSave?.(e.target.value)}
                className={cn(
                  "w-full bg-transparent outline-none leading-snug border-b border-primary/40 pb-0.5",
                  depth === 0 ? "text-sm font-medium" : "text-xs text-muted-foreground",
                )}
              />
            ) : (
              <>
                <span
                  className={cn(
                    "block truncate leading-snug cursor-text",
                    depth === 0 ? "text-sm font-medium" : "text-xs text-muted-foreground",
                    isCompleted && "line-through opacity-50",
                  )}
                  onClick={(e) => { e.stopPropagation(); onEditStart?.(); }}
                >
                  {task.title}
                </span>
                {task.description && depth === 0 && (
                  <span className="text-xs text-muted-foreground/70 truncate block mt-0.5">{task.description}</span>
                )}
              </>
            )}
          </div>
          {/* Mobile: read-only status chip (no Select — avoids duplicate) */}
          {depth === 0 && (
            <span className={cn(
              "sm:hidden shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              isCompleted
                ? "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5"
                : "border-border/60 text-muted-foreground",
            )}>
              {taskStatuses.find((s) => s.id === task.status)?.name ?? "—"}
            </span>
          )}
        </div>

        {/* Mobile metadata chips */}
        {depth === 0 && (
          <div className="sm:hidden flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 pl-4">
            {task.dueDate && (
              <span className={cn("flex items-center gap-1 text-[11px] font-medium", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                <Calendar className="size-3 shrink-0" />
                {formatDate(task.dueDate, todayYear)}
                {task.dueTime && <span className="opacity-70"> · {formatTime(task.dueTime)}</span>}
              </span>
            )}
            {task.priority && (
              <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", PRIORITY_PILL[task.priority])}>
                {task.priority[0].toUpperCase() + task.priority.slice(1)}
              </span>
            )}
            {subtaskProgress && (
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${subtaskProgress.pct}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{subtaskProgress.done}/{subtaskProgress.total}</span>
              </div>
            )}
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
            {(task.focusMinutes ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Timer className="size-3 shrink-0" />
                {formatFocus(task.focusMinutes!)}
              </span>
            )}
          </div>
        )}

        {/* Desktop: subtask progress + focus time under title */}
        {depth === 0 && (subtaskProgress || (task.focusMinutes ?? 0) > 0) && (
          <div className="hidden sm:flex items-center gap-3 mt-1">
            {subtaskProgress && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-0.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/50" style={{ width: `${subtaskProgress.pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground/60">{subtaskProgress.done}/{subtaskProgress.total}</span>
              </div>
            )}
            {(task.focusMinutes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Timer className="size-3 shrink-0" />
                {formatFocus(task.focusMinutes!)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Status — single instance (not duplicated for mobile) */}
      {depth === 0 ? (
        <div onClick={(e) => e.stopPropagation()} className={cn("hidden sm:flex items-center justify-center shrink-0 py-2.5", COL_STATUS)}>
          <StatusSelect
            task={task}
            taskStatuses={taskStatuses}
            terminalIds={terminalIds}
            onStatusChange={onStatusChange}
            isCompleted={isCompleted}
          />
        </div>
      ) : (
        <div className={cn("hidden sm:block shrink-0", COL_STATUS)} />
      )}

      {/* Desktop: Priority */}
      <div className={cn("hidden sm:flex items-center justify-center shrink-0 py-2.5", COL_PRIORITY)}>
        {depth === 0 && task.priority && (
          <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", PRIORITY_PILL[task.priority])}>
            {task.priority[0].toUpperCase() + task.priority.slice(1)}
          </span>
        )}
      </div>

      {/* Desktop: Due */}
      <div className={cn("hidden sm:flex items-center justify-center shrink-0 py-2.5", COL_DUE)}>
        {depth === 0 && task.dueDate && (
          <span className={cn("flex flex-col items-center gap-0.5", isOverdue ? "text-red-500" : "text-muted-foreground")}>
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Calendar className="size-3 shrink-0" />
              {formatDate(task.dueDate, todayYear)}
            </span>
            {task.dueTime && (
              <span className="text-[10px] opacity-70 font-normal">{formatTime(task.dueTime)}</span>
            )}
          </span>
        )}
      </div>

      {/* Desktop: Project — lazy picker */}
      <div onClick={(e) => e.stopPropagation()} className={cn("hidden md:flex items-center justify-center shrink-0 py-2.5", COL_PROJECT)}>
        {depth === 0 && (
          <RowProjectPicker
            projects={projects}
            value={task.projectId ?? undefined}
            onChange={(pid) => onProjectChange(task.id, pid)}
          />
        )}
      </div>

      {/* Timer · Details · Delete */}
      <div className={cn(COL_ACTIONS, "flex items-center justify-center gap-0.5 shrink-0 py-2.5")}>
        {depth === 0 && (
          <>
            {onLinkTimer && (
              <button
                title={isLinked ? "Unlink from focus timer" : "Link to focus timer"}
                onClick={(e) => { e.stopPropagation(); onLinkTimer(task.id); }}
                className={cn(
                  "p-1 rounded-md transition-all cursor-pointer",
                  isLinked
                    ? "text-emerald-600 dark:text-emerald-500 opacity-100"
                    : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-emerald-500/8",
                )}
              >
                <Timer className="size-3.5" />
              </button>
            )}
            <button
              title="Open details"
              onClick={(e) => { e.stopPropagation(); onSelect(task); }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
            >
              <PanelRight className="size-3.5" />
            </button>
            <button
              title="Delete task"
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(task.id); }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

// ─── DebouncedSearch — owns its own state so TasksScreen never re-renders on keystrokes ──

const DebouncedSearch = memo(function DebouncedSearch({
  onSearch,
  disabled,
}: {
  onSearch: (q: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const debounced = useDebounce(value, 500);

  useEffect(() => { onSearch(debounced); }, [debounced, onSearch]);

  return (
    <SearchInput
      placeholder="Search tasks… (N to create)"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label="Search tasks"
      className="w-full h-7 border-0 bg-transparent shadow-none focus-within:ring-0 text-sm"
      disabled={disabled}
    />
  );
});

// ─── EmptyState ────────────────────────────────────────────────────────────────

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

// ─── VirtualTaskList — virtualized flat row list ───────────────────────────────

interface VirtualTaskListProps {
  rows: FlatRow[];
  tab: string;
  isFiltered: boolean;
  showOverdueOnly: boolean;
  todayStr: string;
  terminalIds: Set<string>;
  collapsedIds: Set<string>;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  dragOverId: string | null;
  projects: ProjectOption[];
  taskStatuses: TaskStatusDefinition[];
  onAdd: () => void;
  onToggleExpand: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onSelect: (task: Task) => void;
  onDeleteRequest: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onProjectChange: (id: string, projectId: string | undefined) => void;
  editingId: string | null;
  onEditStart: (id: string) => void;
  onEditSave: (id: string, title: string) => void;
  onEditCancel: () => void;
  linkedId: string | null;
  onLinkTimer: (id: string) => void;
}

const VirtualTaskList = memo(function VirtualTaskList({
  rows,
  tab,
  isFiltered,
  showOverdueOnly,
  todayStr,
  terminalIds,
  collapsedIds,
  isSelectMode,
  selectedIds,
  dragOverId,
  projects,
  taskStatuses,
  onAdd,
  onToggleExpand,
  onToggle,
  onStatusChange,
  onSelect,
  onDeleteRequest,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onProjectChange,
  editingId,
  onEditStart,
  onEditSave,
  onEditCancel,
  linkedId,
  onLinkTimer,
}: VirtualTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => rows[i]?.type === "subtask" ? 36 : 52,
    overscan: 8,
  });

  if (rows.length === 0) {
    return (
      <EmptyState
        message={isFiltered || showOverdueOnly ? `No ${tab} tasks match your filters` : `No ${tab} tasks yet`}
        onAdd={onAdd}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Scroll container — header lives inside so both share the same width context (scrollbar included) */}
      <div
        ref={parentRef}
        className="overflow-auto max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-260px)]"
      >
        {/* Column header — sticky so it stays visible while scrolling */}
        <div className="hidden sm:flex items-center border-b border-border/40 bg-muted/30 sticky top-0 z-10">
          <div className={cn(COL_ICON, "shrink-0")} />
          <div className="flex-1 min-w-0 py-1.5 pl-5 pr-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Task</div>
          <div className={cn(COL_STATUS, "shrink-0 flex items-center justify-center py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>Status</div>
          <div className={cn(COL_PRIORITY, "shrink-0 flex items-center justify-center py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>Priority</div>
          <div className={cn(COL_DUE, "shrink-0 flex items-center justify-center py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>Due</div>
          <div className={cn(COL_PROJECT, "hidden md:flex items-center justify-center shrink-0 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50")}>Project</div>
          <div className={cn(COL_ACTIONS, "shrink-0")} />
        </div>

        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((vItem) => {
            const row = rows[vItem.index]!;
            const depth = row.type === "subtask" ? 1 : 0;
            const task = row.task;
            const parentTask = depth === 0 ? task : null;
            const expanded = parentTask ? !collapsedIds.has(parentTask.id) : false;

            return (
              <div
                key={vItem.key}
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vItem.start}px)`,
                }}
                className={cn(
                  vItem.index < rows.length - 1 && "border-b border-border/30",
                )}
              >
                <TaskRow
                  task={task}
                  depth={depth}
                  expanded={expanded}
                  todayStr={todayStr}
                  terminalIds={terminalIds}
                  onToggleExpand={onToggleExpand}
                  onToggle={onToggle}
                  onStatusChange={onStatusChange}
                  onSelect={onSelect}
                  onDeleteRequest={onDeleteRequest}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(task.id)}
                  onToggleSelect={onToggleSelect}
                  isDragOver={dragOverId === task.id}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  projects={projects}
                  onProjectChange={onProjectChange}
                  taskStatuses={taskStatuses}
                  isEditing={editingId === task.id}
                  onEditStart={() => onEditStart(task.id)}
                  onEditSave={(title) => onEditSave(task.id, title)}
                  onEditCancel={onEditCancel}
                  isLinked={linkedId === task.id}
                  onLinkTimer={onLinkTimer}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ─── TasksScreen ───────────────────────────────────────────────────────────────

export function TasksScreen() {
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectFilterOpen, setProjectFilterOpen] = useState(false);
  const [statusesSheetOpen, setStatusesSheetOpen] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "due" | "priority">("default");
  const [bulkProjectOpen, setBulkProjectOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const savedCollapsedIds = useRef<Set<string>>(new Set());

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const handleSearch = useCallback((q: string) => setDebouncedSearch(q), []);

  const {
    workspaceId,
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
    collapsedIds,
    setCollapsedIds,
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
    handleTitleSave,
    handleLoadMore,
  } = useTasksScreen({ search: debouncedSearch });

  // Pre-compute terminal status IDs as a Set — O(1) lookups in rows
  const terminalIds = useMemo(
    () => new Set(taskStatuses.filter((s) => s.isTerminal && !s.archivedAt).map((s) => s.id)),
    [taskStatuses],
  );

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsForPicker) m.set(p.id, p.name);
    return m;
  }, [projectsForPicker]);

  const projectFilterLabel =
    filterProjectId === "all" ? "All projects" : projectNameById.get(filterProjectId) ?? "Project";

  const hasActiveFilters = filterProjectId !== "all" || filterPriority !== "all" || showOverdueOnly;

  const clearFilters = useCallback(() => {
    setFilterProjectId("all");
    setFilterPriority("all");
    setShowOverdueOnly(false);
  }, [setFilterProjectId, setFilterPriority]);

  const [activeStatusTab, setActiveStatusTab] = useState("");
  useEffect(() => {
    const ids = statusColumns.map((c) => c.status.id);
    if (ids.length === 0) return;
    if (!activeStatusTab || !ids.includes(activeStatusTab)) setActiveStatusTab(ids[0]!);
  }, [statusColumns, activeStatusTab]);

  // Keyboard shortcut: N = new task
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "n" && e.key !== "N") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      setCreateOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Stable callbacks (prevent memoized child re-renders) ─────────────────────

  const handleCreate = useCallback((body: CreateTaskBody) => {
    createMutation.mutate(body);
  }, [createMutation]);

  const handleSelectTask = useCallback((task: Task) => {
    setDrawerTask(task);
    setDrawerOpen(true);
  }, []);

  const handleEditStart = useCallback((id: string) => setEditingId(id), []);
  const handleEditSave = useCallback((id: string, title: string) => {
    setEditingId(null);
    handleTitleSave(id, title);
  }, [handleTitleSave]);
  const handleEditCancel = useCallback(() => setEditingId(null), []);

  const handleStatusChange = useCallback((id: string, status: string) => {
    updateMutation.mutate({ id, body: { status } });
  }, [updateMutation]);

  const handleSaveDrawer = useCallback((id: string, body: Parameters<typeof updateMutation.mutate>[0]["body"]) => {
    updateMutation.mutate({ id, body }, {
      onSuccess: (updated) => {
        if (updated) setDrawerTask(updated);
        toast.success("Task updated");
      },
    });
  }, [updateMutation]);

  const handleDeleteRequest = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteId) return;
    handleDelete(confirmDeleteId);
    if (drawerTask?.id === confirmDeleteId) setDrawerOpen(false);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, handleDelete, drawerTask]);

  const handleProjectChange = useCallback((id: string, projectId: string | undefined) => {
    updateMutation.mutate({ id, body: { projectId: projectId ?? null } });
  }, [updateMutation]);

  const { linkedId, setLinkedId } = usePomodoroLink();
  const handleLinkTimer = useCallback((id: string) => {
    if (linkedId === id) {
      setLinkedId(null);
      toast.info("Focus timer unlinked");
    } else {
      setLinkedId(id);
      const task = tasks.find((t) => t.id === id);
      toast.success(`Focusing: ${task?.title ?? "task"}`, { duration: 2000 });
    }
  }, [linkedId, setLinkedId, tasks]);

  const handleSelectAll = useCallback((visibleTasks: Task[]) => {
    const allIds = new Set(visibleTasks.map((t) => t.id));
    const allSelected = visibleTasks.every((t) => selectedIds.has(t.id));
    setSelectedIds(allSelected ? new Set() : allIds);
  }, [selectedIds, setSelectedIds]);

  const handleBulkMoveProject = useCallback((projectId: string | undefined) => {
    const ids = Array.from(selectedIds);
    Promise.all(
      ids.map((id) => updateMutation.mutateAsync({ id, body: { projectId: projectId ?? null } }))
    ).then(() => {
      setSelectedIds(new Set());
      setBulkProjectOpen(false);
      toast.success(`Moved ${ids.length} task${ids.length !== 1 ? "s" : ""}`);
    }).catch(() => toast.error("Some tasks could not be moved"));
  }, [selectedIds, setSelectedIds, updateMutation]);

  // ── Per-tab flat rows (sorted + filtered, then flattened with subtasks) ────────

  const flatRowsByTab = useMemo(() => {
    const result = new Map<string, FlatRow[]>();
    for (const { status: s, tasks: colTasks } of statusColumns) {
      let visible = showOverdueOnly
        ? colTasks.filter((t) => !!t.dueDate && t.dueDate.slice(0, 10) < todayStr)
        : colTasks;
      if (sortBy === "due") {
        visible = [...visible].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        });
      } else if (sortBy === "priority") {
        visible = [...visible].sort(
          (a, b) => (PRIORITY_RANK[a.priority ?? ""] ?? 3) - (PRIORITY_RANK[b.priority ?? ""] ?? 3),
        );
      }
      result.set(s.id, flattenVisible(visible, collapsedIds));
    }
    return result;
  }, [statusColumns, showOverdueOnly, sortBy, todayStr, collapsedIds]);

  function tabCount(statusId: string, colTasks: Task[]) {
    if (!showOverdueOnly) return colTasks.length;
    const filtered = colTasks.filter((t) => !!t.dueDate && t.dueDate.slice(0, 10) < todayStr);
    return filtered.length;
  }

  if (isLoading) return <ScreenLoader variant="app" />;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectMode ? "secondary" : "ghost"}
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                if (!isSelectMode) {
                  savedCollapsedIds.current = new Set(collapsedIds);
                  setCollapsedIds(new Set(tasks.filter((t) => t.subtasks?.length).map((t) => t.id)));
                } else {
                  setCollapsedIds(savedCollapsedIds.current);
                  setSelectedIds(new Set());
                }
                setIsSelectMode((p) => !p);
              }}
              disabled={!workspaceId}
            >
              {isSelectMode ? "Cancel" : "Select"}
            </Button>
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
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/50 sm:border-b-0 sm:border-r sm:flex-1">
            <DebouncedSearch onSearch={handleSearch} disabled={!workspaceId} />
          </div>
          <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-none">
            <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  role="combobox"
                  disabled={!workspaceId || projectsLoading}
                  className={cn(FILTER_BTN, filterProjectId !== "all" && "text-foreground font-medium")}
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
              <SelectTrigger className={cn(FILTER_BTN, "w-auto", filterPriority !== "all" && "text-foreground font-medium")}>
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
                FILTER_BTN,
                showOverdueOnly && "text-red-500 font-medium bg-red-500/10 hover:text-red-500 hover:bg-red-500/15 dark:hover:bg-red-500/20",
              )}
            >
              <AlertCircle className="size-3.5" />
              Overdue
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={FILTER_BTN}
                title="Clear all filters"
              >
                <X className="size-3" />
                Clear
              </button>
            )}

            <div className="w-px h-4 bg-border/60 shrink-0 mx-1" />

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className={cn(FILTER_BTN, "w-auto")}>
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

        {/* Select / bulk bar */}
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

        {error && <p className="text-sm text-destructive">Failed to load tasks</p>}

        {/* Status tabs */}
        {!error && statusColumns.length > 0 && (
          <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab} className="min-w-0">
            <TabsList className="flex h-9 w-full bg-transparent border-b border-border/50 rounded-none p-0 gap-0 justify-start overflow-x-auto">
              {statusColumns.map(({ status: s, tasks: colTasks }) => {
                const count = tabCount(s.id, colTasks);
                const showFraction = showOverdueOnly && count !== colTasks.length;
                return (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="cursor-pointer text-xs h-9 px-4 shrink-0 rounded-none font-medium text-muted-foreground bg-transparent shadow-none border-x-0 border-t-0 border-b-2 border-b-transparent data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-b-primary focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-b-transparent"
                  >
                    {s.name}
                    <span className={cn(
                      "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      activeStatusTab === s.id ? "bg-primary/15 dark:bg-primary/25 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      {showFraction ? `${count}/${colTasks.length}` : count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {statusColumns.map(({ status: s, tasks: colTasks }) => (
              <TabsContent key={s.id} value={s.id} className="min-w-0 mt-3">
                <VirtualTaskList
                  rows={flatRowsByTab.get(s.id) ?? []}
                  tab={s.name}
                  isFiltered={isFiltered}
                  showOverdueOnly={showOverdueOnly}
                  todayStr={todayStr}
                  terminalIds={terminalIds}
                  collapsedIds={collapsedIds}
                  isSelectMode={isSelectMode}
                  selectedIds={selectedIds}
                  dragOverId={dragOverId}
                  projects={projectsForPicker}
                  taskStatuses={taskStatuses}
                  onAdd={() => setCreateOpen(true)}
                  onToggleExpand={handleToggleExpand}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
                  onSelect={handleSelectTask}
                  onDeleteRequest={handleDeleteRequest}
                  onToggleSelect={handleToggleSelect}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onProjectChange={handleProjectChange}
                  editingId={editingId}
                  onEditStart={handleEditStart}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  linkedId={linkedId}
                  onLinkTimer={handleLinkTimer}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {!error && tasks.length < total && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-muted-foreground text-xs">
              Load more ({tasks.length} / {total})
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task and all its subtasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        onDelete={handleDeleteRequest}
        onToggleSubtask={handleToggle}
        workspaceId={workspaceId}
        taskStatuses={taskStatuses}
        projects={projectsForPicker}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <Sheet open={statusesSheetOpen} onOpenChange={setStatusesSheetOpen}>
        <SheetContent side="right" className="flex w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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
