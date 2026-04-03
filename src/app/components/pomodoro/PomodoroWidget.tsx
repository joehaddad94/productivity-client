"use client";

import { useState, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { usePomodoroTimer, type SessionType } from "./usePomodoroTimer";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useLogStatMutation } from "@/app/hooks/useAnalyticsApi";
import { cn } from "@/app/components/ui/utils";

const SESSION_LABELS: Record<SessionType, string> = {
  work: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

const SESSION_COLORS: Record<SessionType, string> = {
  work: "bg-primary text-primary-foreground",
  short_break: "bg-emerald-500 text-white",
  long_break: "bg-blue-500 text-white",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PomodoroWidget() {
  const [expanded, setExpanded] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const logStatMutation = useLogStatMutation(workspaceId);

  const handleSessionComplete = useCallback(
    (type: SessionType, focusMinutes: number) => {
      const label = SESSION_LABELS[type];
      toast.success(`${label} session complete!`, {
        description:
          type === "work"
            ? `Great work! You focused for ${focusMinutes} minutes.`
            : "Time to get back to work!",
      });

      if (type === "work" && focusMinutes > 0 && workspaceId) {
        logStatMutation.mutate({ focusMinutes });
      }
    },
    [workspaceId, logStatMutation]
  );

  const { state, start, pause, reset, skip } = usePomodoroTimer(
    undefined,
    handleSessionComplete
  );

  const { sessionType, secondsLeft, isRunning, sessionCount } = state;

  const progress =
    1 -
    secondsLeft /
      (sessionType === "work"
        ? 25 * 60
        : sessionType === "short_break"
        ? 5 * 60
        : 15 * 60);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300",
          expanded ? "w-64" : "w-auto",
          "bg-white dark:bg-gray-900"
        )}
      >
        {/* Header — always visible */}
        <button
          aria-label="Toggle Pomodoro timer"
          onClick={() => setExpanded((p) => !p)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium",
            SESSION_COLORS[sessionType],
            "transition-colors"
          )}
        >
          <Timer className="size-3.5 flex-shrink-0" />
          <span className="font-mono text-sm font-bold">{formatTime(secondsLeft)}</span>
          {expanded ? (
            <ChevronDown className="size-3.5 ml-auto" />
          ) : (
            <ChevronUp className="size-3.5 ml-auto" />
          )}
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="p-4 space-y-4">
            {/* Session label */}
            <div className="text-center">
              <span
                className={cn(
                  "inline-block px-3 py-0.5 rounded-full text-xs font-medium",
                  SESSION_COLORS[sessionType]
                )}
              >
                {SESSION_LABELS[sessionType]}
              </span>
            </div>

            {/* Progress ring */}
            <div className="flex items-center justify-center">
              <div className="relative size-24">
                <svg
                  className="size-24 -rotate-90"
                  viewBox="0 0 96 96"
                >
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-gray-100 dark:text-gray-800"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress)}`}
                    strokeLinecap="round"
                    className={
                      sessionType === "work"
                        ? "text-primary"
                        : sessionType === "short_break"
                        ? "text-emerald-500"
                        : "text-blue-500"
                    }
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xl font-bold">
                    {formatTime(secondsLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={reset}
                title="Reset"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                size="sm"
                aria-label={isRunning ? "Pause" : "Start"}
                className={cn(
                  "h-9 w-9 p-0 rounded-full",
                  SESSION_COLORS[sessionType]
                )}
                onClick={isRunning ? pause : start}
              >
                {isRunning ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={skip}
                title="Skip session"
              >
                <SkipForward className="size-3.5" />
              </Button>
            </div>

            {/* Session count */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              Session {sessionCount + 1} &middot; {sessionCount} completed
            </div>

            {/* Session dots */}
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    i < sessionCount % 4
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
