/**
 * Tasks API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/tasks
 */

import type { Task, ThreadItem } from "@/lib/types";

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

export type ListTasksParams = {
  status?: string;
  priority?: string;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  projectId?: string;
  limit?: number;
  skip?: number;
};

export type CreateTaskBody = {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: "low" | "medium" | "high";
  /** Task status id from workspace task-statuses (or legacy slugs). */
  status?: string;
  parentTaskId?: string;
  recurrenceRule?: "DAILY" | "WEEKLY" | "MONTHLY";
  projectId?: string;
  assigneeIds?: string[];
};

export type UpdateTaskBody = Partial<Omit<CreateTaskBody, "projectId" | "recurrenceRule">> & {
  projectId?: string | null;
  recurrenceRule?: "DAILY" | "WEEKLY" | "MONTHLY" | null;
};

export type TasksPage = { tasks: Task[]; total: number };

export type BulkTaskAction = "complete" | "delete";
export type BulkTaskBody = { action: BulkTaskAction; ids: string[] };

export const tasksApi = {
  list: async (workspaceId: string, params?: ListTasksParams): Promise<TasksPage> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.dueBefore) qs.set("dueBefore", params.dueBefore);
    if (params?.dueAfter) qs.set("dueAfter", params.dueAfter);
    if (params?.search) qs.set("search", params.search);
    if (params?.projectId) qs.set("projectId", params.projectId);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/tasks${query}`);
    if (res.status === 401) return { tasks: [], total: 0 };
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    const d = data as { tasks?: Task[]; total?: number };
    return { tasks: d.tasks ?? [], total: d.total ?? 0 };
  },

  get: async (workspaceId: string, id: string): Promise<Task | null> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },

  create: async (workspaceId: string, body: CreateTaskBody): Promise<Task> => {
    const res = await api(`/workspaces/${workspaceId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },

  update: async (workspaceId: string, id: string, body: UpdateTaskBody): Promise<Task> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },

  delete: async (workspaceId: string, id: string): Promise<void> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${id}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },

  bulk: async (workspaceId: string, body: BulkTaskBody): Promise<{ affected: number }> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/bulk`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as { affected: number };
  },

  logFocus: async (workspaceId: string, id: string, minutes: number): Promise<Task> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${id}/log-focus`, {
      method: "POST",
      body: JSON.stringify({ minutes }),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },

  reorder: async (workspaceId: string, ids: string[]): Promise<void> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/reorder`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },

  assign: async (
    workspaceId: string,
    taskId: string,
    userIds: string[],
  ): Promise<Task> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },

  getThread: async (workspaceId: string, taskId: string): Promise<ThreadItem[]> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${taskId}/comments`);
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { thread: ThreadItem[] }).thread ?? [];
  },

  postComment: async (workspaceId: string, taskId: string, content: string): Promise<ThreadItem> => {
    const res = await api(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { item: ThreadItem }).item;
  },

  deleteComment: async (workspaceId: string, taskId: string, commentId: string): Promise<void> => {
    const res = await api(
      `/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`,
      { method: "DELETE" },
    );
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },

  unassign: async (
    workspaceId: string,
    taskId: string,
    userId: string,
  ): Promise<Task> => {
    const res = await api(
      `/workspaces/${workspaceId}/tasks/${taskId}/assign/${userId}`,
      { method: "DELETE" },
    );
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { task: Task }).task;
  },
};
