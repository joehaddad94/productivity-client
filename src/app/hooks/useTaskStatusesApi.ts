"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { TaskStatusDefinition } from "@/lib/types";
import {
  taskStatusesApi,
  type CreateTaskStatusBody,
  type UpdateTaskStatusBody,
} from "@/lib/api/task-statuses-api";
import { getDefaultTaskStatuses } from "@/features/tasks/lib/taskStatusDefaults";

export const TASK_STATUSES_QUERY_KEY = (workspaceId: string) =>
  ["task-statuses", workspaceId] as const;

export function useTaskStatusesQuery(
  workspaceId: string | null | undefined,
  options?: Omit<UseQueryOptions<TaskStatusDefinition[]>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
    queryFn: async () => {
      if (!workspaceId) return [];
      try {
        const rows = await taskStatusesApi.list(workspaceId);
        if (rows.length > 0) return rows;
      } catch {
        /* API not available or empty — use defaults */
      }
      return getDefaultTaskStatuses(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 10 * 60_000,
    ...options,
  });
}

export function useCreateTaskStatusMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<TaskStatusDefinition, Error, CreateTaskStatusBody>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskStatusBody) => taskStatusesApi.create(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: options?.onError,
  });
}

export function useUpdateTaskStatusMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<
    TaskStatusDefinition,
    Error,
    { id: string; body: UpdateTaskStatusBody }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskStatusBody }) =>
      taskStatusesApi.update(workspaceId!, id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      // Write updated status directly — avoids refetch race when move() fires two mutations back-to-back
      queryClient.setQueryData<TaskStatusDefinition[]>(
        TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
        (prev) => prev ? prev.map((s) => (s.id === variables.id ? data : s)) : prev,
      );
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: (err, vars, context, mutation) => {
      // Refetch only on error to revert optimistic cache patch
      queryClient.invalidateQueries({ queryKey: TASK_STATUSES_QUERY_KEY(workspaceId ?? "") });
      options?.onError?.(err, vars, context, mutation);
    },
  });
}

export function useSwapTaskStatusesMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<TaskStatusDefinition[], Error, { idA: string; idB: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idA, idB }) => taskStatusesApi.swap(workspaceId!, idA, idB),
    ...options,
    onSuccess: (updated, variables, context, mutation) => {
      // Patch both statuses directly in cache — one round trip, no competing refetches
      queryClient.setQueryData<TaskStatusDefinition[]>(
        TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
        (prev) => {
          if (!prev) return prev;
          const map = new Map(updated.map((s) => [s.id, s]));
          return prev.map((s) => map.get(s.id) ?? s);
        },
      );
      options?.onSuccess?.(updated, variables, context, mutation);
    },
    onError: (err, vars, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASK_STATUSES_QUERY_KEY(workspaceId ?? "") });
      options?.onError?.(err, vars, context, mutation);
    },
  });
}

export function useDeleteTaskStatusMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, { id: string; replacementTaskStatusId?: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replacementTaskStatusId }: { id: string; replacementTaskStatusId?: string }) =>
      taskStatusesApi.delete(workspaceId!, id, replacementTaskStatusId),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
      });
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId ?? ""] });
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: options?.onError,
  });
}
