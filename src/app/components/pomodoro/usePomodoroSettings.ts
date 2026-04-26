"use client";

import { useState, useCallback } from "react";

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
  } catch { /* ignore */ }
}

export function usePomodoroSettings() {
  const [settings, setSettings] = useState<PomodoroPreferences>(readSettings);

  const update = useCallback((patch: Partial<PomodoroPreferences>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}
