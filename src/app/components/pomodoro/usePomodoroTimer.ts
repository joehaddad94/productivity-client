"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { PomodoroPreferences, SessionType } from "./usePomodoroSettings";

export type { SessionType };

export interface PomodoroState {
  sessionType: SessionType;
  secondsLeft: number;
  isRunning: boolean;
  sessionCount: number;
  totalFocusMinutes: number;
}

const STATE_KEY = "pomodoro_timer_state";

function sessionDuration(type: SessionType, prefs: PomodoroPreferences): number {
  switch (type) {
    case "work": return prefs.workMinutes * 60;
    case "short_break": return prefs.shortBreakMinutes * 60;
    case "long_break": return prefs.longBreakMinutes * 60;
  }
}

function nextSessionType(current: SessionType, count: number, prefs: PomodoroPreferences): SessionType {
  if (current !== "work") return "work";
  return count % prefs.sessionsBeforeLongBreak === 0 ? "long_break" : "short_break";
}

interface PersistedState extends PomodoroState {
  savedAt: number;
}

/** Same output on server and client first paint — avoids hydration mismatch with persisted timer state. */
function createBlankState(prefs: PomodoroPreferences): PomodoroState {
  return {
    sessionType: "work",
    secondsLeft: prefs.workMinutes * 60,
    isRunning: false,
    sessionCount: 0,
    totalFocusMinutes: 0,
  };
}

function loadState(prefs: PomodoroPreferences): PomodoroState {
  const blank = createBlankState(prefs);
  if (typeof window === "undefined") return blank;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return blank;
    const saved: PersistedState = JSON.parse(raw);
    let secondsLeft = saved.secondsLeft;
    if (saved.isRunning && saved.savedAt) {
      secondsLeft = Math.max(0, saved.secondsLeft - Math.round((Date.now() - saved.savedAt) / 1000));
    }
    if (secondsLeft <= 0) {
      // Session completed while away — advance without logging focus time
      const newCount = saved.sessionCount + (saved.sessionType === "work" ? 1 : 0);
      const next = nextSessionType(saved.sessionType, newCount, prefs);
      return {
        sessionType: next,
        secondsLeft: sessionDuration(next, prefs),
        isRunning: false,
        sessionCount: newCount,
        totalFocusMinutes: saved.totalFocusMinutes,
      };
    }
    return { ...saved, secondsLeft, isRunning: false };
  } catch {
    return blank;
  }
}

function persistState(state: PomodoroState) {
  try {
    const p: PersistedState = { ...state, savedAt: Date.now() };
    localStorage.setItem(STATE_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

export function usePomodoroTimer(
  prefs: PomodoroPreferences,
  onSessionComplete?: (type: SessionType, focusMinutes: number) => void,
) {
  // Never read localStorage in useState init — that differs on server vs client. Hydrate after mount.
  const [state, setState] = useState<PomodoroState>(() => createBlankState(prefs));
  const stateRef = useRef(state);
  stateRef.current = state;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalTitleRef = useRef<string | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const skipNextPersist = useRef(false);
  const runningSecondsRef = useRef(0);

  // Restore from localStorage after first paint so SSR + first client render match (hydration-safe).
  useLayoutEffect(() => {
    setState(loadState(prefsRef.current));
    skipNextPersist.current = true;
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    persistState(state);
  }, [state]);

  // Tab title — save original on first run, restore on unmount/pause
  useEffect(() => {
    if (state.isRunning) {
      if (originalTitleRef.current === null) originalTitleRef.current = document.title;
      const m = Math.floor(state.secondsLeft / 60).toString().padStart(2, "0");
      const s = (state.secondsLeft % 60).toString().padStart(2, "0");
      const label = state.sessionType === "work" ? "Focus" : state.sessionType === "short_break" ? "Break" : "Long Break";
      document.title = `${m}:${s} · ${label} — Tasky`;
    } else if (originalTitleRef.current !== null) {
      document.title = originalTitleRef.current;
      originalTitleRef.current = null;
    }
  }, [state.isRunning, state.secondsLeft, state.sessionType]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const advanceSession = useCallback((focusSecondsOverride?: number) => {
    const cur = stateRef.current;
    const wasWork = cur.sessionType === "work";
    const actualSeconds = focusSecondsOverride !== undefined ? focusSecondsOverride : runningSecondsRef.current;
    const focusMinutes = wasWork ? Math.round(actualSeconds / 60) : 0;
    runningSecondsRef.current = 0;
    const newCount = cur.sessionCount + (wasWork ? 1 : 0);
    const newTotal = cur.totalFocusMinutes + focusMinutes;
    const next = nextSessionType(cur.sessionType, newCount, prefs);

    onSessionComplete?.(cur.sessionType, focusMinutes);

    setState({
      sessionType: next,
      secondsLeft: sessionDuration(next, prefs),
      isRunning: prefs.autoStart,
      sessionCount: newCount,
      totalFocusMinutes: newTotal,
    });
  }, [prefs, onSessionComplete]);

  useEffect(() => {
    if (!state.isRunning) { clearTimer(); return; }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsLeft <= 1) {
          clearTimer();
          setTimeout(() => advanceSession(), 0);
          return { ...prev, secondsLeft: 0, isRunning: false };
        }
        runningSecondsRef.current += 1;
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return clearTimer;
  }, [state.isRunning, clearTimer, advanceSession]);

  const start = useCallback(() => setState((p) => ({ ...p, isRunning: true })), []);
  const pause = useCallback(() => setState((p) => ({ ...p, isRunning: false })), []);
  const reset = useCallback(() => {
    clearTimer();
    runningSecondsRef.current = 0;
    setState((p) => ({ ...p, secondsLeft: sessionDuration(p.sessionType, prefsRef.current), isRunning: false }));
  }, [clearTimer]);
  const skip = useCallback(() => { clearTimer(); advanceSession(0); }, [clearTimer, advanceSession]);

  return { state, start, pause, reset, skip };
}
