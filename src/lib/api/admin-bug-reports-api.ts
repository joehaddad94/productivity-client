/**
 * Admin bug reports (requires isAdmin on session user).
 * Base: {NEXT_PUBLIC_API_URL}/admin/bug-reports
 */

import type { BugReport, BugReportStatus } from "@/lib/types";
import { api, parseJson, throwApiError } from "./client";

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
    if (!res.ok) throwApiError(res, data);
    return data as { bugs: BugReport[]; total: number };
  },

  stats: async (): Promise<AdminBugStats> => {
    const res = await api("/admin/bug-reports/stats");
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return data as AdminBugStats;
  },

  update: async (id: string, body: UpdateBugReportBody): Promise<{ bug: BugReport }> => {
    const res = await api(`/admin/bug-reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return data as { bug: BugReport };
  },
};
