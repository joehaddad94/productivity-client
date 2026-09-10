import { api } from "./client";

export type ServerTimerState = {
  sessionType: "work" | "short_break" | "long_break";
  startedAt: string | null;
  secondsLeft: number;
  sessionCount: number;
  totalFocusMinutes: number;
};

/**
 * Timer sync is best-effort on purpose: the Pomodoro timer reconstructs its
 * state from localStorage and elapsed time, so a failed sync degrades to a
 * local-only timer rather than an error the user has to deal with. Both calls
 * therefore swallow failures instead of going through `request`.
 *
 * Note this does NOT use the shared parseJson: an absent timer state has to
 * come back as null, and the shared helper returns {} for an empty body.
 */
export const timerStateApi = {
  get: async (): Promise<ServerTimerState | null> => {
    try {
      const res = await api("/timer-state");
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) return null;
      return JSON.parse(text) as ServerTimerState;
    } catch {
      return null;
    }
  },

  update: async (body: Partial<ServerTimerState>): Promise<void> => {
    try {
      await api("/timer-state", { method: "PATCH", body: JSON.stringify(body) });
    } catch {
      /* fire-and-forget */
    }
  },
};
