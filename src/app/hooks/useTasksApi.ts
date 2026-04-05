"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Task } from "@/lib/types";
import {
  tasksApi,
  type CreateTaskBody,
  type UpdateTaskBody,
  type ListTasksParams,
  type TasksPage,
  type BulkTaskBody,
} from "@/lib/api/tasks-api";

export const TASKS_QUERY_KEY = (workspaceId: string) =>
  ["tasks", workspaceId] as const;
export const TASK_QUERY_KEY = (workspaceId: string, id: string) =>
  ["tasks", workspaceId, id] as const;

export function useTasksQuery(
  workspaceId: string | null | undefined,
  params?: ListTasksParams,
  options?: Omit<UseQueryOptions<TasksPage>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY(workspaceId ?? ""), params] as const,
    queryFn: () => tasksApi.list(workspaceId!, params),
    enabled: !!workspaceId,
    ...options,
  });
}

export function useTaskQuery(
  workspaceId: string | null | undefined,
  id: string | null | undefined,
  options?: Omit<UseQueryOptions<Task | null>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: TASK_QUERY_KEY(workspaceId ?? "", id ?? ""),
    queryFn: () => tasksApi.get(workspaceId!, id!),
    enabled: !!workspaceId && !!id,
    ...options,
  });
}

export function useCreateTaskMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Task, Error, CreateTaskBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskBody) => tasksApi.create(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      options?.onSuccess?.(data, variables, context, mutation);
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
    },
  });
}

export function useUpdateTaskMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Task, Error, { id: string; body: UpdateTaskBody }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskBody }) =>
      tasksApi.update(workspaceId!, id, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(
        TASK_QUERY_KEY(workspaceId ?? "", data.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteTaskMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(workspaceId!, id),
    ...options,
    onSuccess: (_, id, context, mutation) => {
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEY(workspaceId ?? "", id) });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}

export function useBulkTasksMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<{ affected: number }, Error, BulkTaskBody>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkTaskBody) => tasksApi.bulk(workspaceId!, body),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
