/**
 * Admin bug reports (requires isAdmin on session user).
 * Base: {NEXT_PUBLIC_API_URL}/admin/bug-reports
 */

import type { BugReport, BugReportStatus } from "@/lib/types";

function getMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return (o.message[0] as string) ?? "Bad request";
    if (typeof o.error === "string") return o.error;
  }
  return "Request failed";
}

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

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: res.statusText || "Request failed" };
  }
}

export type AdminBugListParams = {
  status?: BugReportStatus | "all";
  limit?: number;
  skip?: number;
};

export type AdminBugStats = {
  byStatus: Record<string, number>;
  totalOpen: number;
  last7Days: number;
  topRoutes: { route: string; count: number }[];
};

export type UpdateBugReportBody = {
  status?: BugReportStatus;
  priority?: "low" | "medium" | "high" | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
};

export const adminBugReportsApi = {
  list: async (params: AdminBugListParams = {}): Promise<{ bugs: BugReport[]; total: number }> => {
    const qs = new URLSearchParams();
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.skip != null) qs.set("skip", String(params.skip));
    const q = qs.toString();
    const res = await api(`/admin/bug-reports${q ? `?${q}` : ""}`);
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as { bugs: BugReport[]; total: number };
  },

  stats: async (): Promise<AdminBugStats> => {
    const res = await api("/admin/bug-reports/stats");
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as AdminBugStats;
  },

  update: async (id: string, body: UpdateBugReportBody): Promise<{ bug: BugReport }> => {
    const res = await api(`/admin/bug-reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as { bug: BugReport };
  },
};
