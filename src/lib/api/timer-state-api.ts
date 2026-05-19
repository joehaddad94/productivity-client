const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "";

function api(path: string, options: RequestInit = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
  });
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export type ServerTimerState = {
  sessionType: "work" | "short_break" | "long_break";
  startedAt: string | null;
  secondsLeft: number;
  sessionCount: number;
  totalFocusMinutes: number;
};

export const timerStateApi = {
  get: async (): Promise<ServerTimerState | null> => {
    try {
      const res = await api("/timer-state");
      if (!res.ok) return null;
      return (await parseJson(res)) as ServerTimerState | null;
    } catch {
      return null;
    }
  },

  update: async (body: Partial<ServerTimerState>): Promise<void> => {
    try {
      await api("/timer-state", { method: "PATCH", body: JSON.stringify(body) });
    } catch { /* fire-and-forget */ }
  },
};
