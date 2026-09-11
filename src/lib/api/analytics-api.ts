/**
 * Analytics API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/analytics
 */

import type { AnalyticsResult, DailyStat, MemberStat } from "@/lib/types";
import { api, parseJson, throwApiError } from "./client";

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
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { analytics: AnalyticsResult }).analytics;
  },

  getTeam: async (workspaceId: string, params?: AnalyticsQueryParams): Promise<MemberStat[]> => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/analytics/team${query}`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { members: MemberStat[] }).members ?? [];
  },

  log: async (workspaceId: string, body: LogStatBody): Promise<DailyStat> => {
    const res = await api(`/workspaces/${workspaceId}/analytics/log`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { stat: DailyStat }).stat;
  },
};
