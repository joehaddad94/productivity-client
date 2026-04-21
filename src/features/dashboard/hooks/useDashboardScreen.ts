"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { useAnalyticsQuery } from "@/app/hooks/useAnalyticsApi";
import type { TaskStatusDefinition } from "@/lib/types";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
  isTaskStatusTerminal,
} from "@/features/tasks/lib/taskStatusHelpers";

export function useDashboardScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(workspaceId);
  const tasks = tasksPage?.tasks ?? [];
  const { data: rawStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawStatuses),
    [workspaceId, rawStatuses],
  );

  const { data: analytics } = useAnalyticsQuery(workspaceId, {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const createMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => toast.success("Task added"),
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateTaskMutation(workspaceId, {
    onSuccess: () => toast.success("Task updated"),
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

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !workspaceId) return;
    createMutation.mutate({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr));
  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate.split("T")[0] < todayStr &&
      !isTaskStatusTerminal(t.status, taskStatuses),
  );
  const pendingTasks = tasks
    .filter((t) => !isTaskStatusTerminal(t.status, taskStatuses))
    .slice(0, 5);
  const completedCount = tasks.filter((t) => isTaskStatusTerminal(t.status, taskStatuses)).length;
  const totals = analytics?.totals ?? { tasksCompleted: 0, focusMinutes: 0, streak: 0 };

  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.dueDate &&
        t.dueDate.slice(0, 10) > todayStr &&
        !isTaskStatusTerminal(t.status, taskStatuses),
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  return {
    workspaceId,
    newTaskTitle,
    setNewTaskTitle,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    tasks,
    taskStatuses,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    pendingTasks,
    completedCount,
    totals,
  };
}
