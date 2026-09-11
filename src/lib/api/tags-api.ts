/**
 * Workspace tags API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/tags
 *
 * Method   Path                                        Description
 * GET      /workspaces/:wid/tags                       List tags with usage counts
 * POST     /workspaces/:wid/tags/rename                Rename a tag across the workspace
 * DELETE   /workspaces/:wid/tags/:tag                  Remove a tag from every note
 */
import { api, parseJson, throwApiError } from "./client";

export type WorkspaceTag = { tag: string; count: number };

export const tagsApi = {
  list: async (workspaceId: string): Promise<WorkspaceTag[]> => {
    const res = await api(`/workspaces/${workspaceId}/tags`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { tags?: WorkspaceTag[] }).tags ?? [];
  },

  rename: async (
    workspaceId: string,
    from: string,
    to: string,
  ): Promise<{ renamed: number }> => {
    const res = await api(`/workspaces/${workspaceId}/tags/rename`, {
      method: "POST",
      body: JSON.stringify({ from, to }),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { renamed?: number }).renamed !== undefined
      ? (data as { renamed: number })
      : { renamed: 0 };
  },

  delete: async (workspaceId: string, tag: string): Promise<{ affected: number }> => {
    const res = await api(
      `/workspaces/${workspaceId}/tags/${encodeURIComponent(tag)}`,
      { method: "DELETE" },
    );
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { affected?: number }).affected !== undefined
      ? (data as { affected: number })
      : { affected: 0 };
  },
};
