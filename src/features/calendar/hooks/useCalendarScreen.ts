"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery, useCreateTaskMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { ensureTaskStatuses, isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";
import { useCalendarEventsQuery } from "@/app/hooks/useCalendarConnectionsApi";
import type { ExternalCalendarEvent } from "@/lib/api/calendar-connections-api";

export const PRIORITY_DOT: Record<string, string> = {
  high:   "bg-red-400",
  medium: "bg-orange-400",
  low:    "bg-gray-400",
};

export const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Local-timezone date string to avoid UTC off-by-one near midnight
export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useCalendarScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(now));
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Fetch up to 500 tasks — removes the default 50-task calendar blind spot
  const { data: page } = useTasksQuery(workspaceId, { limit: 500 });
  const allTasks = page?.tasks ?? [];

  const { data: rawStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawStatuses),
    [workspaceId, rawStatuses],
  );

  const createMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => { toast.success("Task added"); setQuickAddTitle(""); setShowQuickAdd(false); },
    onError: (err) => toast.error(err.message),
  });

  const handleAddTaskOnDate = () => {
    const title = quickAddTitle.trim();
    if (!title || !workspaceId) return;
    createMutation.mutate({ title, dueDate: selectedDate });
  };

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

  const handlePrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const todayYMD = toYMD(now);

  // Always 42 cells (6 rows) so grid height never shifts between months
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const selectedExternalEvents = externalByDate.get(selectedDate) ?? [];

  // "Upcoming" shows tasks in the viewed month:
  //   - Current month → from today onward
  //   - Future month  → all tasks in the month
  //   - Past month    → nothing (month has passed)
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
        .slice(0, 8)
    : [];

  const upcomingLabel = isCurrentMonth
    ? "Upcoming this month"
    : isFutureMonth
    ? `Tasks in ${MONTH_NAMES[viewMonth]}`
    : null; // past month — panel is hidden

  return {
    now,
    viewYear, viewMonth,
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
    upcomingLabel,
    taskStatuses,
    quickAddTitle, setQuickAddTitle,
    showQuickAdd, setShowQuickAdd,
    handleAddTaskOnDate,
    createMutation,
  };
}
