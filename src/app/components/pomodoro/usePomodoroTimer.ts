"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import type { PomodoroPreferences, SessionType } from "./usePomodoroSettings";
import { timerStateApi, type ServerTimerState } from "@/lib/api/timer-state-api";

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

function createBlankState(prefs: PomodoroPreferences): PomodoroState {
  return {
    sessionType: "work",
    secondsLeft: prefs.workMinutes * 60,
    isRunning: false,
    sessionCount: 0,
    totalFocusMinutes: 0,
  };
}

function loadLocalState(prefs: PomodoroPreferences): PomodoroState {
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

type ReconcileResult = {
  state: PomodoroState;
  completedSession?: { type: SessionType; focusMinutes: number };
};

function reconcileServerState(server: ServerTimerState, prefs: PomodoroPreferences): ReconcileResult {
  const type = server.sessionType as SessionType;

  if (server.startedAt) {
    const elapsed = Math.round((Date.now() - new Date(server.startedAt).getTime()) / 1000);
    const secondsLeft = server.secondsLeft - elapsed;

    if (secondsLeft <= 0) {
      // Session completed while no browser was open — advance and log retroactively
      const focusMinutes = type === "work" ? Math.round(server.secondsLeft / 60) : 0;
      const newCount = server.sessionCount + (type === "work" ? 1 : 0);
      const next = nextSessionType(type, newCount, prefs);
      return {
        state: {
          sessionType: next,
          secondsLeft: sessionDuration(next, prefs),
          isRunning: false,
          sessionCount: newCount,
          totalFocusMinutes: server.totalFocusMinutes + focusMinutes,
        },
        completedSession: focusMinutes > 0 ? { type, focusMinutes } : undefined,
      };
    }

    return {
      state: {
        sessionType: type,
        secondsLeft,
        isRunning: true,
        sessionCount: server.sessionCount,
        totalFocusMinutes: server.totalFocusMinutes,
      },
    };
  }

  return {
    state: {
      sessionType: type,
      secondsLeft: server.secondsLeft,
      isRunning: false,
      sessionCount: server.sessionCount,
      totalFocusMinutes: server.totalFocusMinutes,
    },
  };
}

function persistLocal(state: PomodoroState) {
  try {
    const p: PersistedState = { ...state, savedAt: Date.now() };
    localStorage.setItem(STATE_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

function pushServer(patch: Partial<ServerTimerState>) {
  void timerStateApi.update(patch);
}

export function usePomodoroTimer(
  prefs: PomodoroPreferences,
  onSessionComplete?: (type: SessionType, focusMinutes: number) => void,
) {
  const [state, setState] = useState<PomodoroState>(() => createBlankState(prefs));
  const stateRef = useRef(state);
  stateRef.current = state;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalTitleRef = useRef<string | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const skipNextPersist = useRef(false);
  const runningSecondsRef = useRef(0);
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // Hydrate from localStorage first (fast, synchronous after paint), then override from server.
  useLayoutEffect(() => {
    setState(loadLocalState(prefsRef.current));
    skipNextPersist.current = true;

    timerStateApi.get().then((server) => {
      if (!server) return;
      const { state: next, completedSession } = reconcileServerState(server, prefsRef.current);
      setState(next);
      persistLocal(next);
      if (completedSession) {
        // Session completed while no browser was open — fire the callback to log focus time
        onSessionCompleteRef.current?.(completedSession.type, completedSession.focusMinutes);
        // Persist the advanced state to server
        pushServer({
          sessionType: next.sessionType,
          startedAt: null,
          secondsLeft: next.secondsLeft,
          sessionCount: next.sessionCount,
          totalFocusMinutes: next.totalFocusMinutes,
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep localStorage in sync on every state change (offline fallback)
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    persistLocal(state);
  }, [state]);

  // Re-sync from server when tab becomes visible (picks up changes from another browser/device)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      timerStateApi.get().then((server) => {
        if (!server) return;
        const { state: next, completedSession } = reconcileServerState(server, prefsRef.current);
        setState(next);
        if (completedSession) {
          onSessionCompleteRef.current?.(completedSession.type, completedSession.focusMinutes);
          pushServer({
            sessionType: next.sessionType,
            startedAt: null,
            secondsLeft: next.secondsLeft,
            sessionCount: next.sessionCount,
            totalFocusMinutes: next.totalFocusMinutes,
          });
        }
      });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Tab title
  useEffect(() => {
    if (state.isRunning) {
      if (originalTitleRef.current === null) originalTitleRef.current = document.title;
      const m = Math.floor(state.secondsLeft / 60).toString().padStart(2, "0");
      const s = (state.secondsLeft % 60).toString().padStart(2, "0");
      const label = state.sessionType === "work" ? "Focus" : state.sessionType === "short_break" ? "Break" : "Long Break";
      document.title = `${m}:${s} · ${label} · Tasky`;
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
    const next = nextSessionType(cur.sessionType, newCount, prefsRef.current);
    const nextSeconds = sessionDuration(next, prefsRef.current);
    const autoStart = prefsRef.current.autoStart;

    onSessionCompleteRef.current?.(cur.sessionType, focusMinutes);

    const newState: PomodoroState = {
      sessionType: next,
      secondsLeft: nextSeconds,
      isRunning: autoStart,
      sessionCount: newCount,
      totalFocusMinutes: newTotal,
    };
    setState(newState);
    pushServer({
      sessionType: next,
      startedAt: autoStart ? new Date().toISOString() : null,
      secondsLeft: nextSeconds,
      sessionCount: newCount,
      totalFocusMinutes: newTotal,
    });
  }, []);

  useEffect(() => {
    if (!state.isRunning) { clearTimer(); return; }

    intervalRef.current = setInterval(() => {
      const cur = stateRef.current;
      if (cur.secondsLeft <= 1) {
        clearTimer();
        advanceSession();
      } else {
        runningSecondsRef.current += 1;
        setState({ ...cur, secondsLeft: cur.secondsLeft - 1 });
      }
    }, 1000);

    return clearTimer;
  }, [state.isRunning, clearTimer, advanceSession]);

  const start = useCallback(() => {
    const cur = stateRef.current;
    setState((p) => ({ ...p, isRunning: true }));
    pushServer({
      sessionType: cur.sessionType,
      startedAt: new Date().toISOString(),
      secondsLeft: cur.secondsLeft,
      sessionCount: cur.sessionCount,
      totalFocusMinutes: cur.totalFocusMinutes,
    });
  }, []);

  const pause = useCallback(() => {
    const cur = stateRef.current;
    setState((p) => ({ ...p, isRunning: false }));
    pushServer({
      sessionType: cur.sessionType,
      startedAt: null,
      secondsLeft: cur.secondsLeft,
      sessionCount: cur.sessionCount,
      totalFocusMinutes: cur.totalFocusMinutes,
    });
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    runningSecondsRef.current = 0;
    const cur = stateRef.current;
    const secondsLeft = sessionDuration(cur.sessionType, prefsRef.current);
    setState((p) => ({ ...p, secondsLeft, isRunning: false }));
    pushServer({
      sessionType: cur.sessionType,
      startedAt: null,
      secondsLeft,
      sessionCount: cur.sessionCount,
      totalFocusMinutes: cur.totalFocusMinutes,
    });
  }, [clearTimer]);

  const skip = useCallback(() => { clearTimer(); advanceSession(0); }, [clearTimer, advanceSession]);

  return { state, start, pause, reset, skip };
}
