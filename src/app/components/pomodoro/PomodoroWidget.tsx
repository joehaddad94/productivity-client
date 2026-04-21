"use client";

import { useState, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { usePomodoroTimer, type SessionType } from "./usePomodoroTimer";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useLogStatMutation } from "@/app/hooks/useAnalyticsApi";
import { useTasksQuery, useLogTaskFocusMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { cn } from "@/app/components/ui/utils";
import type { TaskStatusDefinition } from "@/lib/types";
import { ensureTaskStatuses, isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";

const SESSION_CONFIG: Record<
  SessionType,
  { label: string; gradient: string; glow: string }
> = {
  work: {
    label: "Focus",
    gradient: "from-emerald-700 to-teal-600",
    glow: "shadow-emerald-700/40",
  },
  short_break: {
    label: "Short Break",
    gradient: "from-emerald-500 to-teal-400",
    glow: "shadow-emerald-500/40",
  },
  long_break: {
    label: "Long Break",
    gradient: "from-teal-600 to-cyan-500",
    glow: "shadow-teal-600/40",
  },
};

const SESSION_SECONDS: Record<SessionType, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PomodoroWidget() {
  const [expanded, setExpanded] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const logStatMutation = useLogStatMutation(workspaceId);
  const logTaskFocusMutation = useLogTaskFocusMutation(workspaceId);

  const { data: tasksPage } = useTasksQuery(workspaceId);
  const { data: rawStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawStatuses),
    [workspaceId, rawStatuses],
  );
  const tasks = (tasksPage?.tasks ?? []).filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
  const linkedTask = tasks.find((t) => t.id === linkedTaskId) ?? null;

  const handleSessionComplete = useCallback(
    (type: SessionType, focusMinutes: number) => {
      const { label } = SESSION_CONFIG[type];
      toast.success(`${label} session complete!`, {
        description:
          type === "work"
            ? `Great work! You focused for ${focusMinutes} minutes${linkedTask ? ` on "${linkedTask.title}"` : ""}.`
            : "Time to get back to work!",
      });
      if (type === "work" && focusMinutes > 0 && workspaceId) {
        logStatMutation.mutate({ focusMinutes });
        if (linkedTaskId) {
          logTaskFocusMutation.mutate({ id: linkedTaskId, minutes: focusMinutes });
        }
      }
    },
    [workspaceId, logStatMutation, logTaskFocusMutation, linkedTask, linkedTaskId]
  );

  const { state, start, pause, reset, skip } = usePomodoroTimer(
    undefined,
    handleSessionComplete
  );
  const { sessionType, secondsLeft, isRunning, sessionCount } = state;
  const cfg = SESSION_CONFIG[sessionType];
  const circumference = 2 * Math.PI * 38;
  const progress = 1 - secondsLeft / SESSION_SECONDS[sessionType];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {expanded && (
        <div
          className={cn(
            "w-72 rounded-2xl overflow-hidden",
            "bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl",
            "border border-white/30 dark:border-gray-700/50",
            "shadow-2xl",
            cfg.glow
          )}
        >
          {/* Gradient header */}
          <div className={cn("bg-gradient-to-br px-5 pt-5 pb-6", cfg.gradient)}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-white/90 text-xs font-semibold uppercase tracking-widest">
                {cfg.label}
              </span>
              <span className="text-white/50 text-xs tabular-nums">
                {sessionCount} completed
              </span>
            </div>

            {/* Progress ring */}
            <div className="flex justify-center">
              <div className="relative size-32">
                <svg className="size-32 -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48" cy="48" r="38"
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.15"
                    strokeWidth="5"
                  />
                  <circle
                    cx="48" cy="48" r="38"
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <span className="font-mono text-[1.75rem] font-bold text-white tracking-tight leading-none">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider">
                    {isRunning ? "running" : "paused"}
                  </span>
                </div>
              </div>
            </div>

            {/* Session dots */}
            <div className="flex justify-center gap-2 mt-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i < sessionCount % 4 ? "size-2 bg-white" : "size-1.5 bg-white/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Task link section */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            {linkedTask ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-primary min-w-0">
                  <Link2 className="size-3 flex-shrink-0" />
                  <span className="truncate font-medium">{linkedTask.title}</span>
                </div>
                <button
                  onClick={() => setLinkedTaskId(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Unlink task"
                >
                  <Unlink className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowTaskPicker((v) => !v)}
                  className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Link2 className="size-3" />
                  {tasks.length === 0 ? "No tasks available" : "Focus on a task…"}
                </button>
                {showTaskPicker && tasks.length > 0 && (
                  <div className="absolute bottom-6 left-0 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-60 max-h-48 overflow-y-auto">
                    {tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setLinkedTaskId(t.id);
                          setShowTaskPicker(false);
                        }}
                        className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 truncate"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 px-5 py-4 bg-white/50 dark:bg-gray-900/50">
            <button
              aria-label="Reset"
              title="Reset"
              onClick={reset}
              className="size-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <RotateCcw className="size-4" />
            </button>

            <button
              aria-label={isRunning ? "Pause" : "Start"}
              onClick={isRunning ? pause : start}
              className={cn(
                "size-14 flex items-center justify-center rounded-2xl",
                "bg-gradient-to-br shadow-lg transition-all active:scale-95 hover:opacity-90",
                cfg.gradient,
                cfg.glow
              )}
            >
              {isRunning ? (
                <Pause className="size-5 text-white" />
              ) : (
                <Play className="size-5 text-white ml-0.5" />
              )}
            </button>

            <button
              aria-label="Skip session"
              title="Skip session"
              onClick={skip}
              className="size-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <SkipForward className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed pill */}
      <button
        aria-label="Toggle Pomodoro timer"
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "flex items-center gap-2 pl-3 pr-4 h-10 rounded-full",
          "bg-gradient-to-r shadow-lg transition-all active:scale-95 hover:opacity-90",
          cfg.gradient,
          cfg.glow
        )}
      >
        <div className="relative">
          <Timer className="size-4 text-white" />
          {isRunning && (
            <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-white rounded-full animate-pulse" />
          )}
        </div>
        <span className="font-mono text-sm font-bold text-white tabular-nums">
          {formatTime(secondsLeft)}
        </span>
      </button>
    </div>
  );
}
