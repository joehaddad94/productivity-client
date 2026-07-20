/**
 * Personal rollup API client ("Home / My Tasks").
 * Base: {NEXT_PUBLIC_API_URL}/me
 *
 * See docs/task-model-and-rollup.md — the cross-workspace personal view.
 */

import type { Task } from "@/lib/types";

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

export type CanonicalBucket = "open" | "in_progress" | "done";
export type MeTasksLens = "list" | "calendar";

/** A task in the personal rollup, enriched by the server with cross-workspace context. */
export interface MeTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: "low" | "medium" | "high" | null;
  status: string;
  statusName: string | null;
  statusColor: string | null;
  canonicalBucket: CanonicalBucket;
  completedAt: string | null;
  parentTaskId: string | null;
  createdAt: string;
  workspace: { id: string; name: string; isPersonal: boolean };
  project: { id: string; name: string; color: string | null } | null;
  assignees: {
    userId: string;
    user: { id: string; email: string; name: string | null; avatarUrl: string | null };
  }[];
}

export type MeTasksPage = { tasks: MeTask[]; total: number };

export type MeTasksListParams = {
  lens?: MeTasksLens;
  dueBefore?: string;
  dueAfter?: string;
  limit?: number;
  skip?: number;
};

export type QuickAddBody = {
  title: string;
  /** Omit to land in the personal workspace. */
  workspaceId?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: "low" | "medium" | "high";
  projectId?: string;
};

export const meApi = {
  list: async (params?: MeTasksListParams): Promise<MeTasksPage> => {
    const qs = new URLSearchParams();
    if (params?.lens) qs.set("lens", params.lens);
    if (params?.dueBefore) qs.set("dueBefore", params.dueBefore);
    if (params?.dueAfter) qs.set("dueAfter", params.dueAfter);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/me/tasks${query}`);
    if (res.status === 401) return { tasks: [], total: 0 };
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    const d = data as { tasks?: MeTask[]; total?: number };
    return { tasks: d.tasks ?? [], total: d.total ?? 0 };
  },

  quickAdd: async (body: QuickAddBody): Promise<Task> => {
    const res = await api(`/me/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },
};
