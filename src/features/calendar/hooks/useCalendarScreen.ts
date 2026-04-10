"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery } from "@/app/hooks/useTasksApi";

export const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-orange-400",
  low: "bg-gray-400",
};

export const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function useCalendarScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(now));

  const { data: page } = useTasksQuery(workspaceId, { limit: 200 });
  const allTasks = page?.tasks ?? [];

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
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const todayYMD = toYMD(now);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const upcomingTasks = allTasks
    .filter((t) => t.dueDate && t.status !== "completed" && t.dueDate.slice(0, 10) > todayYMD)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 8);

  return {
    now,
    viewYear,
    viewMonth,
    selectedDate,
    setSelectedDate,
    handlePrev,
    handleNext,
    setViewYear,
    setViewMonth,
    todayYMD,
    cells,
    tasksByDate,
    selectedTasks,
    upcomingTasks,
  };
}
