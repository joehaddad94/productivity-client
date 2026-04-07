/**
 * Analytics API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/analytics
 */

import type { AnalyticsResult, DailyStat } from "@/lib/types";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "";

function api(path: string, options: RequestInit = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
}

function getMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return (o.message[0] as string) ?? "Bad request";
    if (typeof o.error === "string") return o.error;
  }
  return "Request failed";
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

export type AnalyticsQueryParams = {
  from?: string;
  to?: string;
};

export type LogStatBody = {
  date?: string;
  tasksCompleted?: number;
  focusMinutes?: number;
};

export const analyticsApi = {
  get: async (workspaceId: string, params?: AnalyticsQueryParams): Promise<AnalyticsResult> => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/analytics${query}`);
    if (res.status === 401) {
      return { dailyStats: [], totals: { tasksCompleted: 0, focusMinutes: 0, streak: 0 } };
    }
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { analytics: AnalyticsResult }).analytics;
  },

  log: async (workspaceId: string, body: LogStatBody): Promise<DailyStat> => {
    const res = await api(`/workspaces/${workspaceId}/analytics/log`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { stat: DailyStat }).stat;
  },
};
