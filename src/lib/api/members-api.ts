/**
 * Workspace Members API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:id/members
 */

import type { WorkspaceMember } from "@/lib/types";
import { api, getMessage, parseJson, throwApiError } from "./client";

export const membersApi = {
  list: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const res = await api(`/workspaces/${workspaceId}/members`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
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
    if (!res.ok) throwApiError(res, data);
    return data as { invited: boolean; message: string };
  },

  updateRole: async (
    workspaceId: string,
    userId: string,
    role: string
  ): Promise<WorkspaceMember> => {
    return membersApi.updateMember(workspaceId, userId, { role });
  },

  updateMember: async (
    workspaceId: string,
    userId: string,
    body: { role?: string }
  ): Promise<WorkspaceMember> => {
    const res = await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
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
