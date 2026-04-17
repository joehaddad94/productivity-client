/**
 * Workspace tags API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/tags
 *
 * Method   Path                                        Description
 * GET      /workspaces/:wid/tags                       List tags with usage counts
 * POST     /workspaces/:wid/tags/rename                Rename a tag across the workspace
 * DELETE   /workspaces/:wid/tags/:tag                  Remove a tag from every note
 */

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

export type WorkspaceTag = { tag: string; count: number };

export const tagsApi = {
  list: async (workspaceId: string): Promise<WorkspaceTag[]> => {
    const res = await api(`/workspaces/${workspaceId}/tags`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
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
    if (!res.ok) throw new Error(getMessage(data));
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
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { affected?: number }).affected !== undefined
      ? (data as { affected: number })
      : { affected: 0 };
  },
};
