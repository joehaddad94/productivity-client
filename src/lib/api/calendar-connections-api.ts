/**
 * Calendar Connections API client.
 * Base: {NEXT_PUBLIC_API_URL}/calendar-connections
 */

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
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: res.statusText || "Request failed" };
  }
}

function getMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
  }
  return "Request failed";
}

export interface CalendarConnectionInfo {
  id: string;
  provider: "google" | "microsoft";
  createdAt: string;
  expiresAt: string | null;
}

export interface ExternalCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  provider: "google" | "microsoft";
  url?: string;
}

export const calendarConnectionsApi = {
  list: async (): Promise<CalendarConnectionInfo[]> => {
    const res = await api("/calendar-connections");
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as CalendarConnectionInfo[];
  },

  getGoogleAuthUrl: (): string => {
    return `${API_BASE}/calendar-connections/google/auth`;
  },

  getMicrosoftAuthUrl: (): string => {
    return `${API_BASE}/calendar-connections/microsoft/auth`;
  },

  disconnect: async (provider: "google" | "microsoft"): Promise<void> => {
    const res = await api(`/calendar-connections/${provider}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },

  getEvents: async (start: string, end: string): Promise<ExternalCalendarEvent[]> => {
    const qs = new URLSearchParams({ start, end });
    const res = await api(`/calendar-connections/events?${qs}`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as ExternalCalendarEvent[];
  },
};
