/**
 * Workspaces API client. Uses same base and credentials as auth (cookie).
 * Base: {NEXT_PUBLIC_API_URL}/workspaces
 */

import type { Workspace } from "@/lib/types";

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
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m[0] ?? "Bad request";
    return typeof m === "string" ? m : "Bad request";
  }
  return "Request failed";
}

export type CreateWorkspaceBody = {
  name: string;
  slug?: string;
  isPersonal?: boolean;
};

export type UpdateWorkspaceBody = {
  name?: string;
  slug?: string;
  isPersonal?: boolean;
};

export type ListWorkspacesResponse = { workspaces: Workspace[] };

export const workspacesApi = {
  list: async (): Promise<Workspace[]> => {
    const res = await api("/workspaces");
    if (res.status === 401) return [];
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return (data as ListWorkspacesResponse).workspaces ?? [];
  },

  get: async (id: string): Promise<Workspace | null> => {
    const res = await api(`/workspaces/${id}`);
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as Workspace;
  },

  create: async (body: CreateWorkspaceBody): Promise<Workspace> => {
    const res = await api("/workspaces", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as Workspace;
  },

  update: async (id: string, body: UpdateWorkspaceBody): Promise<Workspace> => {
    const res = await api(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(getMessage(data));
    return data as Workspace;
  },

  delete: async (id: string): Promise<void> => {
    const res = await api(`/workspaces/${id}`, { method: "DELETE" });
    if (res.status === 204) return;
    const data = await res.json().catch(() => ({}));
    throw new Error(getMessage(data));
  },
};
