"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useMeTasksQuery, useQuickAddTaskMutation } from "@/hooks/useMeTasks";
import {
  useAllWorkspaceTaskStatuses,
  useCrossWorkspaceTaskMutations,
  meTaskToTask,
} from "@/hooks/useCrossWorkspaceTasks";
import { useProjectsQuery } from "@/app/hooks/useProjectsApi";
import {
  ensureTaskStatuses,
  isTaskStatusTerminal,
  firstTerminalStatusId,
  defaultNonTerminalStatusId,
} from "@/features/tasks/lib/taskStatusHelpers";
import { useCalendarEventsQuery } from "@/app/hooks/useCalendarConnectionsApi";
import type { ExternalCalendarEvent } from "@/lib/api/calendar-connections-api";

export type CalendarView = "month" | "week" | "agenda";

export const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-red-400",
  medium: "bg-orange-400",
  low:    "bg-gray-400",
};

export const CHIP_BG: Record<string, string> = {
  high:   "bg-red-400/15 text-red-400",
  medium: "bg-orange-400/15 text-orange-400",
  low:    "bg-gray-400/15 text-gray-400",
};

export const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getSundayOfWeek(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return toYMD(d);
}

export function useCalendarScreen() {
  const { currentWorkspace, workspaces } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const now = new Date();
  const [view, setView] = useState<CalendarView>("month");
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewWeekStart, setViewWeekStart] = useState(() => getSundayOfWeek(now));
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(now));
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddPriority, setQuickAddPriority] = useState<"high" | "medium" | "low" | "none">("none");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // "My calendar", not "this team's calendar" (docs/task-model-and-rollup.md §4).
  // The list lens returns every task that is mine across every workspace; the
  // calendar buckets them by date locally, so undated and overdue work stays
  // reachable in the agenda and overdue panes.
  const { data: page, isLoading, error } = useMeTasksQuery({ lens: "list", limit: 500 });
  const allTasks: Task[] = useMemo(
    () => (page?.tasks ?? []).map(meTaskToTask),
    [page?.tasks],
  );

  // Only the workspaces that actually have tasks on this calendar.
  const presentWorkspaceIds = useMemo(
    () => [...new Set(allTasks.map((t) => t.workspaceId))],
    [allTasks],
  );
  const statusesByWorkspace = useAllWorkspaceTaskStatuses(presentWorkspaceIds);

  // Status ids are UUIDs and therefore unique across workspaces, so a single
  // flattened list resolves terminality for a task from any workspace. The
  // legacy bare keys collide by design and mean the same thing everywhere.
  const taskStatuses: TaskStatusDefinition[] = useMemo(() => {
    const seen = new Set<string>();
    const merged: TaskStatusDefinition[] = [];
    for (const rows of statusesByWorkspace.values()) {
      for (const row of rows) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        merged.push(row);
      }
    }
    return merged.length > 0 ? merged : ensureTaskStatuses(workspaceId, []);
  }, [statusesByWorkspace, workspaceId]);

  const statusesFor = (wsId: string): TaskStatusDefinition[] =>
    statusesByWorkspace.get(wsId) ?? taskStatuses;

  // Rows now arrive from several workspaces, so each one needs to say where it
  // came from. Only foreign rows are labelled; tagging every row with the
  // workspace you are already in would be noise.
  const workspaceNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of workspaces) map.set(w.id, w.name);
    return map;
  }, [workspaces]);

  const { data: projectsPage } = useProjectsQuery(workspaceId, { limit: 200 });
  const projectsForPicker = useMemo(
    () => projectsPage?.projects.map((p) => ({ id: p.id, name: p.name })) ?? [],
    [projectsPage],
  );

  // Quick-add follows the same rule as Home (§6.2): the active workspace when
  // there is one, otherwise personal, and always self-assigned so the new task
  // comes straight back into this calendar.
  const createMutation = useQuickAddTaskMutation({
    onSuccess: () => { toast.success("Task added"); setQuickAddTitle(""); setShowQuickAdd(false); },
    onError: (err) => toast.error(err.message),
  });

  const { updateMutation, deleteMutation } = useCrossWorkspaceTaskMutations();

  /** A rollup row can belong to any workspace, so carry its own id per call. */
  const workspaceIdOf = (taskId: string): string | null =>
    allTasks.find((t) => t.id === taskId)?.workspaceId ?? null;

  const handleAddTaskOnDate = () => {
    const title = quickAddTitle.trim();
    if (!title || !workspaceId) return;
    // meApi.quickAdd self-assigns the creator server-side (§6.2).
    createMutation.mutate({
      title,
      dueDate: selectedDate,
      ...(workspaceId ? { workspaceId } : {}),
      ...(quickAddPriority !== "none" && { priority: quickAddPriority }),
    });
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleSave = (id: string, body: UpdateTaskBody) => {
    const wsId = workspaceIdOf(id);
    if (!wsId) return;
    updateMutation.mutate({ workspaceId: wsId, id, body });
  };

  const handleDelete = (id: string) => {
    const wsId = workspaceIdOf(id);
    if (!wsId) return;
    setShowDetail(false);
    deleteMutation.mutate(
      { workspaceId: wsId, id },
      {
        onSuccess: () => toast.success("Task deleted"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleToggle = (id: string, completed: boolean) => {
    const wsId = workspaceIdOf(id);
    if (!wsId) return;
    // Resolve done/open against the task's OWN workspace vocabulary — status
    // ids are per-workspace, so the active workspace's ids would be rejected.
    const own = statusesFor(wsId);
    const nextStatus = completed
      ? firstTerminalStatusId(own)
      : defaultNonTerminalStatusId(own);
    updateMutation.mutate(
      { workspaceId: wsId, id, body: { status: nextStatus } },
      { onError: (err) => toast.error(err.message) },
    );
  };

  const todayYMD = toYMD(now);

  // External events for the viewed month
  const rangeStart = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rangeEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const { data: externalEvents = [] } = useCalendarEventsQuery(rangeStart, rangeEnd);

  const externalByDate = useMemo(() => {
    const map = new Map<string, ExternalCalendarEvent[]>();
    for (const ev of externalEvents) {
      const key = ev.start.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [externalEvents]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of allTasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [allTasks]);

  // Week view: 7 days from viewWeekStart
  const weekDays = useMemo(() => {
    const days: string[] = [];
    const start = new Date(viewWeekStart + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(toYMD(d));
    }
    return days;
  }, [viewWeekStart]);

  const handlePrev = () => {
    if (view === "week") {
      const d = new Date(viewWeekStart + "T00:00:00");
      d.setDate(d.getDate() - 7);
      const newStart = toYMD(d);
      setViewWeekStart(newStart);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      const isCurrentM = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      setSelectedDate(isCurrentM ? todayYMD : newStart);
      return;
    }
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const newYear  = viewMonth === 0 ? viewYear - 1 : viewYear;
    setViewYear(newYear);
    setViewMonth(newMonth);
    const isCurrentM = newYear === now.getFullYear() && newMonth === now.getMonth();
    setSelectedDate(isCurrentM ? todayYMD : `${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`);
  };

  const handleNext = () => {
    if (view === "week") {
      const d = new Date(viewWeekStart + "T00:00:00");
      d.setDate(d.getDate() + 7);
      const newStart = toYMD(d);
      setViewWeekStart(newStart);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      const isCurrentM = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      setSelectedDate(isCurrentM ? todayYMD : newStart);
      return;
    }
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const newYear  = viewMonth === 11 ? viewYear + 1 : viewYear;
    setViewYear(newYear);
    setViewMonth(newMonth);
    const isCurrentM = newYear === now.getFullYear() && newMonth === now.getMonth();
    setSelectedDate(isCurrentM ? todayYMD : `${newYear}-${String(newMonth + 1).padStart(2, "0")}-01`);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  // Always 42 cells (6 rows) so grid height never shifts
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const selectedExternalEvents = externalByDate.get(selectedDate) ?? [];

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const isFutureMonth  = viewYear > now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth > now.getMonth());

  const upcomingFrom = isCurrentMonth ? todayYMD : rangeStart;

  const upcomingTasks = (isCurrentMonth || isFutureMonth)
    ? allTasks
        .filter((t) =>
          t.dueDate &&
          !isTaskStatusTerminal(t.status, taskStatuses) &&
          t.dueDate.slice(0, 10) >= upcomingFrom &&
          t.dueDate.slice(0, 10) <= rangeEnd,
        )
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
        .slice(0, 10)
    : [];

  const overdueTasks = useMemo(() =>
    allTasks
      .filter((t) =>
        t.dueDate &&
        !isTaskStatusTerminal(t.status, taskStatuses) &&
        t.dueDate.slice(0, 10) < todayYMD,
      )
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 10),
    [allTasks, taskStatuses, todayYMD],
  );

  const upcomingLabel = isCurrentMonth
    ? "Upcoming this month"
    : isFutureMonth
    ? `Tasks in ${MONTH_NAMES[viewMonth]}`
    : null;

  // Agenda: all tasks with due dates, grouped by date, sorted chronologically
  const agendaGroups = useMemo(() => {
    const sorted = allTasks
      // Match the upcoming and overdue panes, which both drop terminal tasks.
      // Without this the agenda was the one place on the screen still listing
      // finished work, mixed in with what is still outstanding.
      .filter((t) => t.dueDate && !isTaskStatusTerminal(t.status, taskStatuses))
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    const groups = new Map<string, Task[]>();
    for (const t of sorted) {
      const key = t.dueDate!.slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return groups;
  }, [allTasks, taskStatuses]);

  // Week view label e.g. "May 4–10, 2026"
  const weekLabel = (() => {
    const start = new Date(viewWeekStart + "T00:00:00");
    const end   = new Date((weekDays[6] ?? viewWeekStart) + "T00:00:00");
    if (start.getMonth() === end.getMonth()) {
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  })();

  return {
    now,
    view, setView,
    viewYear, viewMonth,
    viewWeekStart,
    weekDays, weekLabel,
    selectedDate, setSelectedDate,
    handlePrev, handleNext,
    setViewYear, setViewMonth,
    todayYMD,
    cells,
    tasksByDate,
    externalByDate,
    selectedTasks,
    selectedExternalEvents,
    upcomingTasks,
    overdueTasks,
    upcomingLabel,
    agendaGroups,
    taskStatuses,
    workspaceNameById,
    activeWorkspaceId: workspaceId,
    projectsForPicker,
    isLoading,
    error,
    quickAddTitle, setQuickAddTitle,
    quickAddPriority, setQuickAddPriority,
    showQuickAdd, setShowQuickAdd,
    handleAddTaskOnDate,
    createMutation,
    updateMutation,
    deleteMutation,
    selectedTask, setSelectedTask,
    showDetail, setShowDetail,
    handleSelectTask,
    handleSave,
    handleDelete,
    handleToggle,
  };
}
