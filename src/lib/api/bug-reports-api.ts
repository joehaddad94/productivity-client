/**
 * Authenticated bug reports.
 * POST {NEXT_PUBLIC_API_URL}/bug-reports
 */

import type { BugReport } from "@/lib/types";
import { api, parseJson, throwApiError } from "./client";

export type CreateBugReportBody = {
  title: string;
  description: string;
  expected?: string;
  actual?: string;
  workspaceId?: string;
  route?: string;
  userAgent?: string;
  contextJson?: Record<string, unknown>;
};

export const bugReportsApi = {
  create: async (body: CreateBugReportBody): Promise<{ bug: BugReport }> => {
    const res = await api("/bug-reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return data as { bug: BugReport };
  },
};
