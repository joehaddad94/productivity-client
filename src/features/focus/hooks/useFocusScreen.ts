"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTaskQuery, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";

export function useFocusScreen() {
  const router = useRouter();
  const { taskId } = useParams<{ taskId: string }>();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);

  const { data: task, isLoading, error } = useTaskQuery(workspaceId, taskId);
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
    updateMutation.mutate({ id, body: { status: completed ? "completed" : "pending" } });
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
