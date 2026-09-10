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
import { api, getMessage, parseJson, throwApiError } from "./client";

function logClientTiming(label: string, start: number, extra?: Record<string, unknown>) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") return;
  const ms = Math.round((performance.now() - start) * 10) / 10;
  console.log(`[notes-timing] ${label}: ${ms}ms`, extra ?? "");
}

export type ListNotesParams = {
  search?: string;
  tags?: string[];
  tagMode?: "any" | "all";
  projectId?: string;
  taskId?: string;
  limit?: number;
  skip?: number;
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

// Update allows explicit null on relation fields to unlink them.
export type UpdateNoteBody = Partial<Omit<CreateNoteBody, "projectId" | "taskId" | "assigneeId">> & {
  projectId?: string | null;
  taskId?: string | null;
  assigneeId?: string | null;
};

export type NotesPage = { notes: Note[]; total: number };

export const notesApi = {
  list: async (workspaceId: string, params?: ListNotesParams): Promise<NotesPage> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.tags && params.tags.length) qs.set("tags", params.tags.join(","));
    if (params?.tagMode) qs.set("tagMode", params.tagMode);
    if (params?.projectId) qs.set("projectId", params.projectId);
    if (params?.taskId) qs.set("taskId", params.taskId);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const res = await api(`/workspaces/${workspaceId}/notes${query}`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    const d = data as { notes?: Note[]; total?: number };
    return { notes: d.notes ?? [], total: d.total ?? 0 };
  },

  get: async (workspaceId: string, id: string): Promise<Note | null> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${id}`);
    if (res.status === 404) return null;
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { note: Note }).note;
  },

  create: async (workspaceId: string, body: CreateNoteBody): Promise<Note> => {
    const startedAt = typeof window !== "undefined" ? performance.now() : 0;
    const res = await api(`/workspaces/${workspaceId}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    logClientTiming("api:create-note", startedAt, {
      workspaceId,
      status: res.status,
    });
    return (data as { note: Note }).note;
  },

  update: async (workspaceId: string, id: string, body: UpdateNoteBody): Promise<Note> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
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

  addTags: async (workspaceId: string, noteId: string, tags: string[]): Promise<Note> => {
    const res = await api(`/workspaces/${workspaceId}/notes/${noteId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tags }),
    });
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { note: Note }).note;
  },

  removeTag: async (workspaceId: string, noteId: string, tag: string): Promise<Note> => {
    const res = await api(
      `/workspaces/${workspaceId}/notes/${noteId}/tags/${encodeURIComponent(tag)}`,
      { method: "DELETE" },
    );
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { note: Note }).note;
  },
};
