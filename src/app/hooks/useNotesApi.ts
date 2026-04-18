"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Note } from "@/lib/types";
import {
  notesApi,
  type CreateNoteBody,
  type UpdateNoteBody,
  type ListNotesParams,
  type NotesPage,
} from "@/lib/api/notes-api";

export const NOTES_QUERY_KEY = (workspaceId: string) =>
  ["notes", workspaceId] as const;
export const NOTE_QUERY_KEY = (workspaceId: string, id: string) =>
  ["notes", workspaceId, id] as const;

type CreateNoteMutationInput = CreateNoteBody & { clientTempId?: string };
type CreateNoteMutationContext = {
  previousPages: Array<[readonly unknown[], NotesPage | undefined]>;
  tempId: string;
};

function upsertNoteInPages(page: NotesPage | undefined, note: Note): NotesPage | undefined {
  if (!page || !Array.isArray(page.notes)) {
    return { notes: [note], total: 1 };
  }
  const existingIndex = page.notes.findIndex((n) => n.id === note.id);
  if (existingIndex >= 0) {
    const next = [...page.notes];
    next[existingIndex] = note;
    return { ...page, notes: next };
  }
  return { ...page, notes: [note, ...page.notes], total: page.total + 1 };
}

function removeNoteFromPages(page: NotesPage | undefined, id: string): NotesPage | undefined {
  if (!page || !Array.isArray(page.notes)) return page;
  const exists = page.notes.some((n) => n.id === id);
  if (!exists) return page;
  return {
    ...page,
    notes: page.notes.filter((n) => n.id !== id),
    total: Math.max(0, page.total - 1),
  };
}

function replaceTempNoteInPages(
  page: NotesPage | undefined,
  tempId: string,
  note: Note
): NotesPage | undefined {
  if (!page || !Array.isArray(page.notes)) return page;
  const tempIndex = page.notes.findIndex((n) => n.id === tempId);
  if (tempIndex >= 0) {
    const next = [...page.notes];
    next[tempIndex] = note;
    return { ...page, notes: next };
  }
  return upsertNoteInPages(page, note);
}

export function useNotesQuery(
  workspaceId: string | null | undefined,
  params?: ListNotesParams,
  options?: Omit<UseQueryOptions<NotesPage>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY(workspaceId ?? ""), params] as const,
    queryFn: () => notesApi.list(workspaceId!, params),
    enabled: !!workspaceId,
    ...options,
  });
}

export function useNoteQuery(
  workspaceId: string | null | undefined,
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Note | null>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: NOTE_QUERY_KEY(workspaceId ?? "", id ?? ""),
    queryFn: () => notesApi.get(workspaceId!, id!),
    enabled: !!workspaceId && !!id,
    ...options,
  });
}

export function useCreateNoteMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Note, Error, CreateNoteMutationInput>
) {
  const queryClient = useQueryClient();
  const workspaceKey = workspaceId ?? "";
  return useMutation({
    mutationFn: ({ clientTempId: _clientTempId, ...body }: CreateNoteMutationInput) =>
      notesApi.create(workspaceId!, body),
    ...options,
    onMutate: async (variables) => {
      const tempId = variables.clientTempId ?? `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();
      const tempNote: Note = {
        id: tempId,
        workspaceId: workspaceKey,
        title: variables.title,
        content: variables.content ?? "",
        tags: variables.tags ?? [],
        projectId: variables.projectId ?? null,
        taskId: variables.taskId ?? null,
        assigneeId: variables.assigneeId ?? null,
        status: variables.status ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await queryClient.cancelQueries({
        queryKey: NOTES_QUERY_KEY(workspaceKey),
      });
      const previousPages = queryClient.getQueriesData<NotesPage>({
        queryKey: NOTES_QUERY_KEY(workspaceKey),
      });
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(workspaceKey) },
        (old) => upsertNoteInPages(old, tempNote)
      );
      queryClient.setQueryData(NOTE_QUERY_KEY(workspaceKey, tempId), tempNote);

      const context: CreateNoteMutationContext = { previousPages, tempId };
      return context;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(
        NOTE_QUERY_KEY(workspaceKey, data.id),
        data
      );
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(workspaceKey) },
        (old) =>
          replaceTempNoteInPages(
            old,
            (context as CreateNoteMutationContext | undefined)?.tempId ??
              variables.clientTempId ??
              "",
            data
          )
      );
      const tempId =
        (context as CreateNoteMutationContext | undefined)?.tempId ??
        variables.clientTempId;
      if (tempId) {
        queryClient.removeQueries({
          queryKey: NOTE_QUERY_KEY(workspaceKey, tempId),
        });
      }
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      const createContext = context as CreateNoteMutationContext | undefined;
      if (createContext?.previousPages) {
        for (const [key, data] of createContext.previousPages) {
          queryClient.setQueryData(key, data);
        }
      }
      const tempId = createContext?.tempId ?? variables.clientTempId;
      if (tempId) {
        queryClient.removeQueries({
          queryKey: NOTE_QUERY_KEY(workspaceKey, tempId),
        });
      }
      options?.onError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(workspaceKey),
        refetchType: "inactive",
      });
      options?.onSettled?.(data, error, variables, context, mutation);
    },
  });
}

export function useUpdateNoteMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Note, Error, { id: string; body: UpdateNoteBody }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNoteBody }) =>
      notesApi.update(workspaceId!, id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(
        NOTE_QUERY_KEY(workspaceId ?? "", data.id),
        data
      );
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) => upsertNoteInPages(old, data)
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteNoteMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.delete(workspaceId!, id),
    ...options,
    onSuccess: (_, id, context, mutation) => {
      queryClient.removeQueries({
        queryKey: NOTE_QUERY_KEY(workspaceId ?? "", id),
      });
      queryClient.setQueriesData<NotesPage>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) => removeNoteFromPages(old, id)
      );
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}
