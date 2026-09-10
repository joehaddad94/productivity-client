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
import { api, getMessage, parseJson, throwApiError } from "./client";

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
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return parseWorkspaceList(data);
  },

  get: async (id: string): Promise<Workspace | null> => {
    const res = await api(`/workspaces/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return parseWorkspace(data);
  },

  create: async (body: CreateWorkspaceBody): Promise<Workspace> => {
    const res = await api("/workspaces", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return parseWorkspace(data);
  },

  update: async (id: string, body: UpdateWorkspaceBody): Promise<Workspace> => {
    const res = await api(`/workspaces/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return parseWorkspace(data);
  },

  delete: async (id: string): Promise<void> => {
    const res = await api(`/workspaces/${id}`, { method: "DELETE" });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
