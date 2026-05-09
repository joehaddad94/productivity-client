"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { useAnalyticsQuery } from "@/app/hooks/useAnalyticsApi";
import { useProjectsQuery } from "@/app/hooks/useProjectsApi";
import type { TaskStatusDefinition } from "@/lib/types";
import {
  filterTodayTasks,
  filterTodayAllTasks,
  filterOverdueTasks,
  filterUpcomingTasks,
  filterNoDateTasks,
} from "@/lib/task-filters";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
  isTaskStatusTerminal,
} from "@/features/tasks/lib/taskStatusHelpers";

export type TaskPriority = "low" | "medium" | "high" | null;

export function useDashboardScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(null);

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(workspaceId);
  const tasks = tasksPage?.tasks ?? [];

  const { data: rawStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawStatuses),
    [workspaceId, rawStatuses],
  );

  const { data: projectsPage } = useProjectsQuery(workspaceId, { limit: 6 });
  const projects = (projectsPage?.projects ?? []).filter((p) => p.status !== "archived");

  // Open task count per project from already-fetched tasks (no extra request)
  const openTasksByProject = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.projectId && !isTaskStatusTerminal(t.status, taskStatuses)) {
        map[t.projectId] = (map[t.projectId] ?? 0) + 1;
      }
    });
    return map;
  }, [tasks, taskStatuses]);

  // Analytics: cover the current month AND at least the last 7 days for streak dots
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const analyticsFrom = sevenDaysAgo.toISOString().split("T")[0] < monthStart
    ? sevenDaysAgo.toISOString().split("T")[0]
    : monthStart;
  const todayStr = now.toISOString().split("T")[0];

  const { data: analytics } = useAnalyticsQuery(workspaceId, {
    from: analyticsFrom,
    to: todayStr,
  });

  const createMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => toast.success("Task added"),
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const terminal = firstTerminalStatusId(taskStatuses);
    const open = defaultNonTerminalStatusId(taskStatuses);
    const next = isTaskStatusTerminal(task.status, taskStatuses) ? open : terminal;
    updateMutation.mutate({ id, body: { status: next } });
  };

  const handleAddTask = (titleOverride?: string) => {
    const title = (titleOverride ?? newTaskTitle).trim();
    if (!title || !workspaceId) return;
    createMutation.mutate({ title, ...(newTaskPriority ? { priority: newTaskPriority } : {}) });
    setNewTaskTitle("");
    setNewTaskPriority(null);
  };

  const todayAllTasks = filterTodayAllTasks(tasks, todayStr);
  const todayTasks    = filterTodayTasks(tasks, todayStr, taskStatuses);
  const todayCompleted = todayAllTasks.length - todayTasks.length;
  const overdueTasks  = filterOverdueTasks(tasks, todayStr, taskStatuses);
  const upcomingTasks = filterUpcomingTasks(tasks, todayStr, taskStatuses);
  const noDateTasks   = filterNoDateTasks(tasks, taskStatuses);

  const totals = analytics?.totals ?? { tasksCompleted: 0, focusMinutes: 0, streak: 0 };

  // Last 7 days as YYYY-MM-DD strings (oldest → newest)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const activeDates = useMemo(() => new Set(
    (analytics?.dailyStats ?? [])
      .filter((s) => s.tasksCompleted > 0 || s.focusMinutes > 0)
      .map((s) => s.date.slice(0, 10)),
  ), [analytics?.dailyStats]);

  const isEmpty = !tasksLoading && todayTasks.length === 0 && overdueTasks.length === 0
    && upcomingTasks.length === 0 && noDateTasks.length === 0;

  return {
    workspaceId,
    newTaskTitle, setNewTaskTitle,
    newTaskPriority, setNewTaskPriority,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    taskStatuses,
    todayAllTasks,
    todayTasks,
    todayCompleted,
    overdueTasks,
    upcomingTasks,
    noDateTasks,
    totals,
    projects,
    openTasksByProject,
    last7Days,
    activeDates,
    todayStr,
    isEmpty,
  };
}
