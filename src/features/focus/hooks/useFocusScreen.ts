"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTaskQuery, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import type { TaskStatusDefinition } from "@/lib/types";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
} from "@/features/tasks/lib/taskStatusHelpers";

export function useFocusScreen() {
  const router = useRouter();
  const { taskId } = useParams<{ taskId: string }>();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);

  const { data: task, isLoading, error } = useTaskQuery(workspaceId, taskId);
  const { data: rawStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawStatuses),
    [workspaceId, rawStatuses],
  );
  const updateMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0 && isPomodoroMode) {
      toast.success("Pomodoro session complete! Take a break.");
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, isPomodoroMode]);

  const handleToggleSubtask = (id: string, completed: boolean) => {
    const next = completed ? firstTerminalStatusId(taskStatuses) : defaultNonTerminalStatusId(taskStatuses);
    updateMutation.mutate({ id, body: { status: next } });
  };

  const handleToggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    if (!isPomodoroMode) setIsPomodoroMode(true);
  };

  const handleResetTimer = () => {
    setTimerSeconds(25 * 60);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    router,
    task,
    taskStatuses,
    isLoading,
    error,
    timerSeconds,
    isTimerRunning,
    isPomodoroMode,
    handleToggleSubtask,
    handleToggleTimer,
    handleResetTimer,
    formatTime,
  };
}
