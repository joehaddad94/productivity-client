/**
 * Workspace Members API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:id/members
 */

import type { WorkspaceMember } from "@/lib/types";

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

export const membersApi = {
  list: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const res = await api(`/workspaces/${workspaceId}/members`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { members: WorkspaceMember[] }).members ?? [];
  },

  invite: async (
    workspaceId: string,
    email: string
  ): Promise<{ invited: boolean; message: string }> => {
    const res = await api(`/workspaces/${workspaceId}/members/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as { invited: boolean; message: string };
  },

  updateRole: async (
    workspaceId: string,
    userId: string,
    role: string
  ): Promise<WorkspaceMember> => {
    const res = await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { member: WorkspaceMember }).member;
  },

  remove: async (workspaceId: string, userId: string): Promise<void> => {
    const res = await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
