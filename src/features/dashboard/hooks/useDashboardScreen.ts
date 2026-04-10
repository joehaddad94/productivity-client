"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";
import { useAnalyticsQuery } from "@/app/hooks/useAnalyticsApi";

export function useDashboardScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(workspaceId);
  const tasks = tasksPage?.tasks ?? [];

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
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateMutation.mutate({ id, body: { status: newStatus } });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !workspaceId) return;
    createMutation.mutate({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr));
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate.split("T")[0] < todayStr && t.status !== "completed"
  );
  const pendingTasks = tasks.filter((t) => t.status !== "completed").slice(0, 5);
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totals = analytics?.totals ?? { tasksCompleted: 0, focusMinutes: 0, streak: 0 };

  return {
    workspaceId,
    newTaskTitle,
    setNewTaskTitle,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    tasks,
    todayTasks,
    overdueTasks,
    pendingTasks,
    completedCount,
    totals,
  };
}
