"use client";

import { useState, useCallback, useEffect } from "react";

export type SessionType = "work" | "short_break" | "long_break";

export interface PomodoroPreferences {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStart: boolean;
  browserNotifications: boolean;
  inAppToasts: boolean;
}

export const POMODORO_DEFAULTS: PomodoroPreferences = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStart: false,
  browserNotifications: true,
  inAppToasts: true,
};

const SETTINGS_KEY = "pomodoro_settings";
const SETTINGS_CHANGED_EVENT = "pomodoro-settings-changed";

function readSettings(): PomodoroPreferences {
  if (typeof window === "undefined") return POMODORO_DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return POMODORO_DEFAULTS;
    return { ...POMODORO_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return POMODORO_DEFAULTS;
  }
}

function writeSettings(s: PomodoroPreferences) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
  } catch { /* ignore */ }
}

export function usePomodoroSettings() {
  // Always start with defaults — safe for SSR. Both server and client render
  // the same initial value, avoiding a hydration mismatch.
  const [settings, setSettings] = useState<PomodoroPreferences>(POMODORO_DEFAULTS);

  // Hydrate from localStorage after mount (client-only).
  useEffect(() => {
    setSettings(readSettings());
  }, []);

  // Re-sync when another hook instance writes new settings.
  useEffect(() => {
    const onChanged = () => setSettings(readSettings());
    window.addEventListener(SETTINGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, onChanged);
  }, []);

  const update = useCallback((patch: Partial<PomodoroPreferences>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
