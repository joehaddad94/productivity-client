"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type SessionType = "work" | "short_break" | "long_break";

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

export interface PomodoroState {
  sessionType: SessionType;
  secondsLeft: number;
  isRunning: boolean;
  sessionCount: number;
  totalFocusMinutes: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

function getSessionDuration(type: SessionType, config: PomodoroConfig): number {
  switch (type) {
    case "work":
      return config.workMinutes * 60;
    case "short_break":
      return config.shortBreakMinutes * 60;
    case "long_break":
      return config.longBreakMinutes * 60;
  }
}

export function usePomodoroTimer(
  config: PomodoroConfig = DEFAULT_CONFIG,
  onSessionComplete?: (type: SessionType, focusMinutes: number) => void
) {
  const [state, setState] = useState<PomodoroState>({
    sessionType: "work",
    secondsLeft: config.workMinutes * 60,
    isRunning: false,
    sessionCount: 0,
    totalFocusMinutes: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advanceSession = useCallback(() => {
    const current = stateRef.current;
    const newCount = current.sessionCount + (current.sessionType === "work" ? 1 : 0);
    const focusMinutesAdded =
      current.sessionType === "work" ? config.workMinutes : 0;
    const newTotal = current.totalFocusMinutes + focusMinutesAdded;

    // Determine next session type
    let nextType: SessionType;
    if (current.sessionType === "work") {
      nextType =
        newCount % config.sessionsBeforeLongBreak === 0
          ? "long_break"
          : "short_break";
    } else {
      nextType = "work";
    }

    onSessionComplete?.(current.sessionType, focusMinutesAdded);

    setState({
      sessionType: nextType,
      secondsLeft: getSessionDuration(nextType, config),
      isRunning: false,
      sessionCount: newCount,
      totalFocusMinutes: newTotal,
    });
  }, [config, onSessionComplete]);

  useEffect(() => {
    if (!state.isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsLeft <= 1) {
          clearTimer();
          // Schedule advance after render
          setTimeout(() => advanceSession(), 0);
          return { ...prev, secondsLeft: 0, isRunning: false };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return clearTimer;
  }, [state.isRunning, clearTimer, advanceSession]);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState((prev) => ({
      ...prev,
      secondsLeft: getSessionDuration(prev.sessionType, config),
      isRunning: false,
    }));
  }, [clearTimer, config]);

  const skip = useCallback(() => {
    clearTimer();
    advanceSession();
  }, [clearTimer, advanceSession]);

  return { state, start, pause, reset, skip };
}
