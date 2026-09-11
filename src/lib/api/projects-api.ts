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
import { api, getMessage, parseJson, throwApiError } from "./client";

export type CreateProjectBody = {
  name: string;
  description?: string;
  status?: string;
  color?: string;
};

export type UpdateProjectBody = {
  name?: string;
  description?: string;
  status?: string;
  color?: string;
};

export type ProjectsPage = { projects: Project[]; total: number };

export const projectsApi = {
  list: async (workspaceId: string, params?: { limit?: number; skip?: number }): Promise<ProjectsPage> => {
    const qs = new URLSearchParams();
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/projects${query}`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    const d = data as { projects?: Project[]; total?: number };
    return { projects: d.projects ?? [], total: d.total ?? 0 };
  },

  get: async (workspaceId: string, id: string): Promise<Project | null> => {
    const res = await api(`/workspaces/${workspaceId}/projects/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { project: Project }).project;
  },

  create: async (workspaceId: string, body: CreateProjectBody): Promise<Project> => {
    const res = await api(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { project: Project }).project;
  },

  update: async (workspaceId: string, id: string, body: UpdateProjectBody): Promise<Project> => {
    const res = await api(`/workspaces/${workspaceId}/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
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
