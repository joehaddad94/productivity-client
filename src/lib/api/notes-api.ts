/**
 * Notes API client.
 * Base: {NEXT_PUBLIC_API_URL}/workspaces/:workspaceId/notes
 *
 * All routes require auth (cookie).
 *
 * Method   Path                                        Description
 * GET      /workspaces/:wid/notes                      List notes (search?, tags?, projectId?)
 * POST     /workspaces/:wid/notes                      Create note
 * GET      /workspaces/:wid/notes/:id                  Get one note
 * PATCH    /workspaces/:wid/notes/:id                  Update note
 * DELETE   /workspaces/:wid/notes/:id                  Delete note
 */

import type { Note } from "@/lib/types";

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

export type ListNotesParams = {
  search?: string;
  tags?: string;
  projectId?: string;
};

export type CreateNoteBody = {
  title: string;
  content?: string;
  tags?: string[];
  projectId?: string;
  taskId?: string;
  assigneeId?: string;
  status?: string;
};

export type UpdateNoteBody = Partial<CreateNoteBody>;

export type ListNotesResponse = { notes: Note[] };

export const notesApi = {
  list: async (workspaceId: string, params?: ListNotesParams): Promise<Note[]> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.tags) qs.set("tags", params.tags);
    if (params?.projectId) qs.set("projectId", params.projectId);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/notes${query}`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as ListNotesResponse).notes ?? [];
  },

  get: async (workspaceId: string, id: string): Promise<Note | null> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { note: Note }).note;
  },

  create: async (workspaceId: string, body: CreateNoteBody): Promise<Note> => {
    const res = await api(`/workspaces/${workspaceId}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { note: Note }).note;
  },

  update: async (workspaceId: string, id: string, body: UpdateNoteBody): Promise<Note> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return (data as { note: Note }).note;
  },

  delete: async (workspaceId: string, id: string): Promise<void> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${id}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },
};
