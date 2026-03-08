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
      options?.onSuccess?.(data, variables, context, mutation);
      queryClient.setQueryData(WORKSPACES_QUERY_KEY, (prev: Workspace[] | undefined) =>
        prev ? [...prev, data] : [data]
      );
      queryClient.setQueryData(WORKSPACE_QUERY_KEY(data.id), data);
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
      queryClient.setQueryData(WORKSPACE_QUERY_KEY(data.id), data);
      queryClient.setQueryData(WORKSPACES_QUERY_KEY, (prev: Workspace[] | undefined) =>
        prev ? prev.map((w) => (w.id === data.id ? data : w)) : [data]
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
