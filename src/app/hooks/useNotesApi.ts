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
  options?: UseMutationOptions<Note, Error, CreateNoteBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteBody) => notesApi.create(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      options?.onSuccess?.(data, variables, context, mutation);
      queryClient.setQueryData(
        NOTE_QUERY_KEY(workspaceId ?? "", data.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY(workspaceId ?? "") });
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
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY(workspaceId ?? "") });
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
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}
