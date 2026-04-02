/**
 * Projects API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/projects
 *
 * All routes require auth (cookie).
 *
 * Method   Path                                        Description
 * GET      /workspaces/:wid/projects                   List projects
 * POST     /workspaces/:wid/projects                   Create project
 * GET      /workspaces/:wid/projects/:id               Get one project
 * PATCH    /workspaces/:wid/projects/:id               Update project
 * DELETE   /workspaces/:wid/projects/:id               Delete project
 */

import type { Project } from "@/lib/types";

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

export type CreateProjectBody = {
  name: string;
};

export type UpdateProjectBody = {
  name?: string;
};

export const projectsApi = {
  list: async (workspaceId: string): Promise<Project[]> => {
    const res = await api(`/workspaces/${workspaceId}/projects`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { projects: Project[] }).projects ?? [];
  },

  get: async (workspaceId: string, id: string): Promise<Project | null> => {
    const res = await api(`/workspaces/${workspaceId}/projects/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { project: Project }).project;
  },

  create: async (workspaceId: string, body: CreateProjectBody): Promise<Project> => {
    const res = await api(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { project: Project }).project;
  },

  update: async (workspaceId: string, id: string, body: UpdateProjectBody): Promise<Project> => {
    const res = await api(`/workspaces/${workspaceId}/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { project: Project }).project;
  },

  delete: async (workspaceId: string, id: string): Promise<void> => {
    const res = await api(`/workspaces/${workspaceId}/projects/${id}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
