"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { notesApi, type NotesPage } from "@/lib/api/notes-api";
import { tagsApi, type WorkspaceTag } from "@/lib/api/tags-api";
import type { Note } from "@/lib/types";
import { NOTES_QUERY_KEY, NOTE_QUERY_KEY } from "./useNotesApi";

export const WORKSPACE_TAGS_QUERY_KEY = (workspaceId: string) =>
  ["workspace-tags", workspaceId] as const;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const n = normalizeTag(raw);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function replaceNoteInPage(page: NotesPage | undefined, note: Note): NotesPage | undefined {
  if (!page || !Array.isArray(page.notes)) return page;
  const idx = page.notes.findIndex((n) => n.id === note.id);
  if (idx < 0) return page;
  const next = [...page.notes];
  next[idx] = note;
  return { ...page, notes: next };
}

function patchNoteTagsInPage(
  page: NotesPage | undefined,
  noteId: string,
  transform: (tags: string[]) => string[],
): { page: NotesPage | undefined; changed: boolean } {
  if (!page || !Array.isArray(page.notes)) return { page, changed: false };
  const idx = page.notes.findIndex((n) => n.id === noteId);
  if (idx < 0) return { page, changed: false };
  const current = page.notes[idx];
  const nextTags = transform(current.tags ?? []);
  if (
    nextTags.length === (current.tags?.length ?? 0) &&
    nextTags.every((t, i) => t === current.tags?.[i])
  ) {
    return { page, changed: false };
  }
  const nextNotes = [...page.notes];
  nextNotes[idx] = { ...current, tags: nextTags };
  return { page: { ...page, notes: nextNotes }, changed: true };
}

type TagMutationContext = {
  previousPages: Array<[readonly unknown[], NotesPage | undefined]>;
  previousNote: Note | null;
  previousWorkspaceTags: WorkspaceTag[] | undefined;
  addedTags: string[];
  removedTag?: string;
};

export function useWorkspaceTagsQuery(
  workspaceId: string | null | undefined,
  options?: Omit<UseQueryOptions<WorkspaceTag[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: WORKSPACE_TAGS_QUERY_KEY(workspaceId ?? ""),
    queryFn: () => tagsApi.list(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
    ...options,
  });
}

export function useAddTagsMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Note, Error, { noteId: string; tags: string[] }, TagMutationContext>,
) {
  const queryClient = useQueryClient();
  const wsKey = workspaceId ?? "";

  return useMutation<Note, Error, { noteId: string; tags: string[] }, TagMutationContext>({
    mutationFn: ({ noteId, tags }) => notesApi.addTags(workspaceId!, noteId, tags),
    ...options,
    onMutate: async ({ noteId, tags }) => {
      const incoming = normalizeTags(tags);

      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY(wsKey) });
      await queryClient.cancelQueries({ queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey) });

      const previousPages = queryClient.getQueriesData<NotesPage>({
        queryKey: NOTES_QUERY_KEY(wsKey),
      });
      const previousNote = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId)) ?? null;
      const previousWorkspaceTags = queryClient.getQueryData<WorkspaceTag[]>(
        WORKSPACE_TAGS_QUERY_KEY(wsKey),
      );

      const actuallyAdded: string[] = [];
      const existingOnNote = new Set(
        (previousNote?.tags ?? []).map((t) => t.toLowerCase()),
      );
      for (const t of incoming) {
        if (!existingOnNote.has(t)) actuallyAdded.push(t);
      }

      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(wsKey) },
        (old) =>
          patchNoteTagsInPage(old, noteId, (existing) => {
            const merged = [...existing];
            const seen = new Set(existing.map((t) => t.toLowerCase()));
            for (const t of incoming) {
              if (!seen.has(t)) {
                merged.push(t);
                seen.add(t);
              }
            }
            return merged;
          }).page,
      );

      if (previousNote) {
        const existing = new Set(previousNote.tags.map((t) => t.toLowerCase()));
        const merged = [...previousNote.tags];
        for (const t of incoming) {
          if (!existing.has(t)) {
            merged.push(t);
            existing.add(t);
          }
        }
        queryClient.setQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId), {
          ...previousNote,
          tags: merged,
        });
      }

      if (previousWorkspaceTags) {
        const map = new Map(previousWorkspaceTags.map((t) => [t.tag, t.count]));
        for (const t of actuallyAdded) {
          map.set(t, (map.get(t) ?? 0) + 1);
        }
        const next = Array.from(map.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
        queryClient.setQueryData<WorkspaceTag[]>(WORKSPACE_TAGS_QUERY_KEY(wsKey), next);
      }

      return {
        previousPages,
        previousNote,
        previousWorkspaceTags,
        addedTags: actuallyAdded,
      };
    },
    onError: (error, variables, context, mutation) => {
      if (context) {
        for (const [key, data] of context.previousPages) {
          queryClient.setQueryData(key, data);
        }
        if (context.previousNote) {
          queryClient.setQueryData(
            NOTE_QUERY_KEY(wsKey, variables.noteId),
            context.previousNote,
          );
        }
        if (context.previousWorkspaceTags !== undefined) {
          queryClient.setQueryData(
            WORKSPACE_TAGS_QUERY_KEY(wsKey),
            context.previousWorkspaceTags,
          );
        }
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(NOTE_QUERY_KEY(wsKey, data.id), data);
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(wsKey) },
        (old) => replaceNoteInPage(old, data),
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
}

export function useRemoveTagMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Note, Error, { noteId: string; tag: string }, TagMutationContext>,
) {
  const queryClient = useQueryClient();
  const wsKey = workspaceId ?? "";

  return useMutation<Note, Error, { noteId: string; tag: string }, TagMutationContext>({
    mutationFn: ({ noteId, tag }) => notesApi.removeTag(workspaceId!, noteId, tag),
    ...options,
    onMutate: async ({ noteId, tag }) => {
      const target = normalizeTag(tag);

      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY(wsKey) });
      await queryClient.cancelQueries({ queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey) });

      const previousPages = queryClient.getQueriesData<NotesPage>({
        queryKey: NOTES_QUERY_KEY(wsKey),
      });
      const previousNote = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId)) ?? null;
      const previousWorkspaceTags = queryClient.getQueryData<WorkspaceTag[]>(
        WORKSPACE_TAGS_QUERY_KEY(wsKey),
      );

      const hadIt = !!previousNote?.tags?.some((t) => t.toLowerCase() === target);

      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(wsKey) },
        (old) =>
          patchNoteTagsInPage(old, noteId, (existing) =>
            existing.filter((t) => t.toLowerCase() !== target),
          ).page,
      );

      if (previousNote) {
        queryClient.setQueryData<Note>(NOTE_QUERY_KEY(wsKey, noteId), {
          ...previousNote,
          tags: previousNote.tags.filter((t) => t.toLowerCase() !== target),
        });
      }

      if (previousWorkspaceTags && hadIt) {
        const next = previousWorkspaceTags
          .map((entry) =>
            entry.tag === target ? { ...entry, count: Math.max(0, entry.count - 1) } : entry,
          )
          .filter((entry) => entry.count > 0);
        queryClient.setQueryData<WorkspaceTag[]>(WORKSPACE_TAGS_QUERY_KEY(wsKey), next);
      }

      return {
        previousPages,
        previousNote,
        previousWorkspaceTags,
        addedTags: [],
        removedTag: target,
      };
    },
    onError: (error, variables, context, mutation) => {
      if (context) {
        for (const [key, data] of context.previousPages) {
          queryClient.setQueryData(key, data);
        }
        if (context.previousNote) {
          queryClient.setQueryData(
            NOTE_QUERY_KEY(wsKey, variables.noteId),
            context.previousNote,
          );
        }
        if (context.previousWorkspaceTags !== undefined) {
          queryClient.setQueryData(
            WORKSPACE_TAGS_QUERY_KEY(wsKey),
            context.previousWorkspaceTags,
          );
        }
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(NOTE_QUERY_KEY(wsKey, data.id), data);
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(wsKey) },
        (old) => replaceNoteInPage(old, data),
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
}

type BulkMutationContext = {
  previousPages: Array<[readonly unknown[], NotesPage | undefined]>;
  previousWorkspaceTags: WorkspaceTag[] | undefined;
  previousNotes: Map<string, Note>;
};

function snapshotAllNotes(queryClient: ReturnType<typeof useQueryClient>, wsKey: string) {
  const map = new Map<string, Note>();
  const pages = queryClient.getQueriesData<NotesPage>({ queryKey: NOTES_QUERY_KEY(wsKey) });
  for (const [, page] of pages) {
    if (!page?.notes) continue;
    for (const n of page.notes) map.set(n.id, n);
  }
  return map;
}

export function useRenameTagMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<
    { renamed: number },
    Error,
    { from: string; to: string },
    BulkMutationContext
  >,
) {
  const queryClient = useQueryClient();
  const wsKey = workspaceId ?? "";

  return useMutation<{ renamed: number }, Error, { from: string; to: string }, BulkMutationContext>({
    mutationFn: ({ from, to }) => tagsApi.rename(workspaceId!, from, to),
    ...options,
    onMutate: async ({ from, to }) => {
      const fromN = normalizeTag(from);
      const toN = normalizeTag(to);

      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY(wsKey) });
      await queryClient.cancelQueries({ queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey) });

      const previousPages = queryClient.getQueriesData<NotesPage>({
        queryKey: NOTES_QUERY_KEY(wsKey),
      });
      const previousWorkspaceTags = queryClient.getQueryData<WorkspaceTag[]>(
        WORKSPACE_TAGS_QUERY_KEY(wsKey),
      );
      const previousNotes = snapshotAllNotes(queryClient, wsKey);

      if (fromN && toN && fromN !== toN) {
        queryClient.setQueriesData<NotesPage>(
          { queryKey: NOTES_QUERY_KEY(wsKey) },
          (old) => {
            if (!old?.notes) return old;
            const nextNotes = old.notes.map((note) => {
              const lower = note.tags?.map((t) => t.toLowerCase()) ?? [];
              if (!lower.includes(fromN)) return note;
              const seen = new Set<string>();
              const mapped: string[] = [];
              for (const t of note.tags ?? []) {
                const replaced = t.toLowerCase() === fromN ? toN : t;
                const key = replaced.toLowerCase();
                if (!seen.has(key)) {
                  seen.add(key);
                  mapped.push(replaced);
                }
              }
              return { ...note, tags: mapped };
            });
            return { ...old, notes: nextNotes };
          },
        );

        for (const [id, note] of previousNotes) {
          const individual = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, id));
          if (!individual) continue;
          const lower = individual.tags?.map((t) => t.toLowerCase()) ?? [];
          if (!lower.includes(fromN)) continue;
          const seen = new Set<string>();
          const mapped: string[] = [];
          for (const t of individual.tags ?? []) {
            const replaced = t.toLowerCase() === fromN ? toN : t;
            const key = replaced.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              mapped.push(replaced);
            }
          }
          queryClient.setQueryData<Note>(NOTE_QUERY_KEY(wsKey, id), { ...individual, tags: mapped });
          void note;
        }

        if (previousWorkspaceTags) {
          const map = new Map(previousWorkspaceTags.map((t) => [t.tag, t.count]));
          const fromCount = map.get(fromN) ?? 0;
          map.delete(fromN);
          if (fromCount > 0) {
            map.set(toN, (map.get(toN) ?? 0) + fromCount);
          }
          const next = Array.from(map.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
          queryClient.setQueryData<WorkspaceTag[]>(WORKSPACE_TAGS_QUERY_KEY(wsKey), next);
        }
      }

      return { previousPages, previousWorkspaceTags, previousNotes };
    },
    onError: (error, variables, context, mutation) => {
      if (context) {
        for (const [key, data] of context.previousPages) {
          queryClient.setQueryData(key, data);
        }
        if (context.previousWorkspaceTags !== undefined) {
          queryClient.setQueryData(
            WORKSPACE_TAGS_QUERY_KEY(wsKey),
            context.previousWorkspaceTags,
          );
        }
        for (const [id, note] of context.previousNotes) {
          const current = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, id));
          if (current) queryClient.setQueryData(NOTE_QUERY_KEY(wsKey, id), note);
        }
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
}

export function useDeleteTagMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<{ affected: number }, Error, { tag: string }, BulkMutationContext>,
) {
  const queryClient = useQueryClient();
  const wsKey = workspaceId ?? "";

  return useMutation<{ affected: number }, Error, { tag: string }, BulkMutationContext>({
    mutationFn: ({ tag }) => tagsApi.delete(workspaceId!, tag),
    ...options,
    onMutate: async ({ tag }) => {
      const target = normalizeTag(tag);

      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY(wsKey) });
      await queryClient.cancelQueries({ queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey) });

      const previousPages = queryClient.getQueriesData<NotesPage>({
        queryKey: NOTES_QUERY_KEY(wsKey),
      });
      const previousWorkspaceTags = queryClient.getQueryData<WorkspaceTag[]>(
        WORKSPACE_TAGS_QUERY_KEY(wsKey),
      );
      const previousNotes = snapshotAllNotes(queryClient, wsKey);

      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(wsKey) },
        (old) => {
          if (!old?.notes) return old;
          const nextNotes = old.notes.map((note) => {
            const lower = note.tags?.map((t) => t.toLowerCase()) ?? [];
            if (!lower.includes(target)) return note;
            return { ...note, tags: note.tags.filter((t) => t.toLowerCase() !== target) };
          });
          return { ...old, notes: nextNotes };
        },
      );

      for (const [id] of previousNotes) {
        const individual = queryClient.getQueryData<Note>(NOTE_QUERY_KEY(wsKey, id));
        if (!individual) continue;
        const lower = individual.tags?.map((t) => t.toLowerCase()) ?? [];
        if (!lower.includes(target)) continue;
        queryClient.setQueryData<Note>(NOTE_QUERY_KEY(wsKey, id), {
          ...individual,
          tags: individual.tags.filter((t) => t.toLowerCase() !== target),
        });
      }

      if (previousWorkspaceTags) {
        queryClient.setQueryData<WorkspaceTag[]>(
          WORKSPACE_TAGS_QUERY_KEY(wsKey),
          previousWorkspaceTags.filter((entry) => entry.tag !== target),
        );
      }

      return { previousPages, previousWorkspaceTags, previousNotes };
    },
    onError: (error, variables, context, mutation) => {
      if (context) {
        for (const [key, data] of context.previousPages) {
          queryClient.setQueryData(key, data);
        }
        if (context.previousWorkspaceTags !== undefined) {
          queryClient.setQueryData(
            WORKSPACE_TAGS_QUERY_KEY(wsKey),
            context.previousWorkspaceTags,
          );
        }
        for (const [id, note] of context.previousNotes) {
          queryClient.setQueryData(NOTE_QUERY_KEY(wsKey, id), note);
        }
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: WORKSPACE_TAGS_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(wsKey),
        refetchType: "inactive",
      });
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
}
