"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Workspace } from "@/lib/types";
import {
  workspacesApi,
  type CreateWorkspaceBody,
  type UpdateWorkspaceBody,
} from "@/lib/api/workspaces-api";

export const WORKSPACES_QUERY_KEY = ["workspaces"] as const;
export const WORKSPACE_QUERY_KEY = (id: string) => ["workspaces", id] as const;

function upsertWorkspace(list: Workspace[] | undefined, next: Workspace): Workspace[] {
  if (!list || list.length === 0) return [next];
  const existingIndex = list.findIndex((w) => w.id === next.id);
  if (existingIndex === -1) return [...list, next];
  const copy = [...list];
  copy[existingIndex] = next;
  return copy;
}

export function useWorkspacesQuery(
  options?: Omit<
    UseQueryOptions<Workspace[]>,
    "queryKey" | "queryFn"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: WORKSPACES_QUERY_KEY,
    queryFn: () => workspacesApi.list(),
    ...options,
  });
}

export function useWorkspaceQuery(
  id: string | null | undefined,
  options?: Omit<
    UseQueryOptions<Workspace | null>,
    "queryKey" | "queryFn"
  > & { enabled?: boolean }
) {
  return useQuery({
    queryKey: WORKSPACE_QUERY_KEY(id ?? ""),
    queryFn: () => workspacesApi.get(id!),
    enabled: !!id,
    ...options,
  });
}

export function useCreateWorkspaceMutation(
  options?: UseMutationOptions<Workspace, Error, CreateWorkspaceBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWorkspaceBody) => workspacesApi.create(body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      if (!data?.id) {
        queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
        options?.onSuccess?.(data, variables, context, mutation);
        return;
      }
      // Update cache before firing the caller's onSuccess so that WorkspaceContext
      // already sees the new workspace when any navigation triggered by onSuccess occurs.
      queryClient.setQueryData(WORKSPACES_QUERY_KEY, (prev: Workspace[] | undefined) =>
        upsertWorkspace(prev, data)
      );
      queryClient.setQueryData(WORKSPACE_QUERY_KEY(data.id), data);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useUpdateWorkspaceMutation(
  options?: UseMutationOptions<
    Workspace,
    Error,
    { id: string; body: UpdateWorkspaceBody }
  >
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWorkspaceBody }) =>
      workspacesApi.update(id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      if (!data?.id) {
        queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
        options?.onSuccess?.(data, variables, context, mutation);
        return;
      }
      queryClient.setQueryData(WORKSPACE_QUERY_KEY(data.id), data);
      queryClient.setQueryData(WORKSPACES_QUERY_KEY, (prev: Workspace[] | undefined) =>
        upsertWorkspace(prev, data)
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteWorkspaceMutation(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    ...options,
    onSuccess: (_, id, context, mutation) => {
      queryClient.removeQueries({ queryKey: WORKSPACE_QUERY_KEY(id) });
      queryClient.setQueryData(WORKSPACES_QUERY_KEY, (prev: Workspace[] | undefined) =>
        prev ? prev.filter((w) => w.id !== id) : []
      );
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}
