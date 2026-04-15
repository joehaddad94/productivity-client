/**
 * Workspaces API client. Uses same base and credentials as auth (cookie).
 * Base: {NEXT_PUBLIC_API_URL}/workspaces
 *
 * All workspace routes require auth (Bearer JWT or cookie).
 *
 * Method   Path              Body                            Description
 * POST     /workspaces       { name, slug?, isPersonal? }    Create workspace; caller becomes owner.
 * GET      /workspaces       —                               List workspaces for current user.
 * GET      /workspaces/:id   —                               Get one workspace (must be member).
 * PATCH    /workspaces/:id   { name?, slug?, isPersonal? }    Update workspace (must be member).
 * DELETE   /workspaces/:id   —                               Delete workspace (owner only).
 * :id is a UUID.
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
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return (o.message[0] as string) ?? "Bad request";
    if (typeof o.error === "string") return o.error;
    if (Array.isArray(o.errors) && o.errors[0] && typeof o.errors[0] === "object" && o.errors[0] !== null) {
      const first = (o.errors[0] as Record<string, unknown>).message;
      if (typeof first === "string") return first;
    }
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

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const ws = value as Partial<Workspace>;
  return (
    typeof ws.id === "string" &&
    ws.id.length > 0 &&
    typeof ws.name === "string"
  );
}

function parseWorkspace(data: unknown): Workspace {
  if (isWorkspace(data)) return data;
  if (data && typeof data === "object") {
    const nested = (data as Record<string, unknown>).workspace;
    if (isWorkspace(nested)) return nested;
  }
  throw new Error("Invalid workspace response from server");
}

function parseWorkspaceList(data: unknown): Workspace[] {
  if (Array.isArray(data)) {
    return data.filter(isWorkspace);
  }
  if (data && typeof data === "object") {
    const raw = (data as Record<string, unknown>).workspaces;
    if (Array.isArray(raw)) return raw.filter(isWorkspace);
  }
  return [];
}

export const workspacesApi = {
  list: async (): Promise<Workspace[]> => {
    const res = await api("/workspaces");
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return parseWorkspaceList(data);
  },

  get: async (id: string): Promise<Workspace | null> => {
    const res = await api(`/workspaces/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return parseWorkspace(data);
  },

  create: async (body: CreateWorkspaceBody): Promise<Workspace> => {
    const res = await api("/workspaces", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return parseWorkspace(data);
  },

  update: async (id: string, body: UpdateWorkspaceBody): Promise<Workspace> => {
    const res = await api(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return parseWorkspace(data);
  },

  delete: async (id: string): Promise<void> => {
    const res = await api(`/workspaces/${id}`, { method: "DELETE" });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
