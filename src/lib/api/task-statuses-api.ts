/**
 * Workspace task statuses (columns / workflow).
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/task-statuses
 *
 * When the API is not deployed yet, the client falls back to built-in defaults
 * (pending / in_progress / completed) — see getDefaultTaskStatuses in features/tasks.
 *
 * GET    /workspaces/:wid/task-statuses
 * POST   /workspaces/:wid/task-statuses
 * PATCH  /workspaces/:wid/task-statuses/:statusId
 * DELETE /workspaces/:wid/task-statuses/:statusId?replacementTaskStatusId=...
 */

import type { TaskStatusDefinition } from "@/lib/types";
import { api, getMessage, parseJson, throwApiError } from "./client";

export type CreateTaskStatusBody = {
  name: string;
  sortOrder?: number;
  isTerminal?: boolean;
  color?: string | null;
};

export type UpdateTaskStatusBody = Partial<CreateTaskStatusBody> & {
  archivedAt?: string | null;
};

export const taskStatusesApi = {
  list: async (workspaceId: string): Promise<TaskStatusDefinition[]> => {
    const res = await api(`/workspaces/${workspaceId}/task-statuses`);
    const data = await parseJson(res);
    if (res.status === 404) return [];
    if (!res.ok) throwApiError(res, data);
    const d = data as { statuses?: TaskStatusDefinition[] };
    return Array.isArray(d.statuses) ? d.statuses : [];
  },

  create: async (
    workspaceId: string,
    body: CreateTaskStatusBody,
  ): Promise<TaskStatusDefinition> => {
    const res = await api(`/workspaces/${workspaceId}/task-statuses`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { status: TaskStatusDefinition }).status;
  },

  update: async (
    workspaceId: string,
    statusId: string,
    body: UpdateTaskStatusBody,
  ): Promise<TaskStatusDefinition> => {
    const res = await api(`/workspaces/${workspaceId}/task-statuses/${statusId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { status: TaskStatusDefinition }).status;
  },

  swap: async (
    workspaceId: string,
    idA: string,
    idB: string,
  ): Promise<TaskStatusDefinition[]> => {
    const res = await api(`/workspaces/${workspaceId}/task-statuses/swap`, {
      method: "POST",
      body: JSON.stringify({ idA, idB }),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { statuses: TaskStatusDefinition[] }).statuses;
  },

  delete: async (
    workspaceId: string,
    statusId: string,
    replacementTaskStatusId?: string,
  ): Promise<void> => {
    const qs = replacementTaskStatusId
      ? `?replacementTaskStatusId=${encodeURIComponent(replacementTaskStatusId)}`
      : "";
    const res = await api(`/workspaces/${workspaceId}/task-statuses/${statusId}${qs}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
