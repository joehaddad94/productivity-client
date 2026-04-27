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
import type { TaskStatusDefinition } from "@/lib/types";
import { TASK_STATUSES_QUERY_KEY } from "@/app/hooks/useTaskStatusesApi";
import { defaultNonTerminalStatusId } from "@/features/tasks/lib/taskStatusHelpers";
import { getDefaultTaskStatuses } from "@/features/tasks/lib/taskStatusDefaults";

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
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });

      const cached = queryClient.getQueryData<TaskStatusDefinition[]>(
        TASK_STATUSES_QUERY_KEY(workspaceId ?? ""),
      );
      const statuses =
        cached && cached.length > 0 ? cached : getDefaultTaskStatuses(workspaceId ?? "");
      const defaultStatusId = defaultNonTerminalStatusId(statuses);

      const tempTask: Task = {
        id: `temp_${Date.now()}`,
        workspaceId: workspaceId ?? "",
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ?? null,
        dueTime: body.dueTime ?? null,
        priority: body.priority ?? null,
        status: body.status ?? defaultStatusId,
        parentTaskId: body.parentTaskId ?? null,
        projectId: body.projectId ?? null,
        recurrenceRule: body.recurrenceRule ?? null,
        recurrenceParentId: null,
        focusMinutes: 0,
        completedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { tasks: [...old.tasks, tempTask], total: old.total + 1 };
        },
      );

      return { tempId: tempTask.id };
    },
    onError: (err, vars, context, mutation) => {
      const ctx = context as { tempId?: string } | undefined;
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { tasks: old.tasks.filter((t) => t.id !== ctx?.tempId), total: old.total - 1 };
        },
      );
      options?.onError?.(err, vars, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      const ctx = context as { tempId?: string } | undefined;
      // Replace the optimistic temp entry with the real task from server
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { ...old, tasks: old.tasks.map((t) => (t.id === ctx?.tempId ? data : t)) };
        },
      );
      queryClient.setQueryData(TASK_QUERY_KEY(workspaceId ?? "", data.id), data);
      // No invalidateQueries here — the cache is already correct from setQueriesData above
      options?.onSuccess?.(data, variables, context, mutation);
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
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });

      // Optimistically patch every matching task list
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { ...old, tasks: old.tasks.map((t) => (t.id === id ? { ...t, ...body } : t)) };
        },
      );

      // Optimistically patch the single-task cache
      queryClient.setQueryData<Task>(
        TASK_QUERY_KEY(workspaceId ?? "", id),
        (old) => (old ? { ...old, ...body } : old) as Task,
      );
    },
    onError: (err, vars, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onError?.(err, vars, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      // Write server response directly — avoids the invalidate→refetch→flash cycle
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) => {
              if (t.id === data.id) return data;
              if (t.subtasks?.some((s) => s.id === data.id))
                return { ...t, subtasks: t.subtasks!.map((s) => (s.id === data.id ? data : s)) };
              return t;
            }),
          };
        },
      );
      queryClient.setQueryData(TASK_QUERY_KEY(workspaceId ?? "", data.id), data);
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });

      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { tasks: old.tasks.filter((t) => t.id !== id), total: old.total - 1 };
        },
      );
    },
    onError: (err, id, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onError?.(err, id, context, mutation);
    },
    onSuccess: (_, id, context, mutation) => {
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEY(workspaceId ?? "", id) });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(_, id, context, mutation);
    },
  });
}

export function useReorderTasksMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tasksApi.reorder(workspaceId!, ids),
    ...options,
    onSuccess: (_, ids, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(_, ids, context, mutation);
    },
  });
}

export function useLogTaskFocusMutation(
  workspaceId: string | null | undefined,
  options?: UseMutationOptions<Task, Error, { id: string; minutes: number }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      tasksApi.logFocus(workspaceId!, id, minutes),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      // Patch single-task cache
      queryClient.setQueryData(TASK_QUERY_KEY(workspaceId ?? "", data.id), data);
      // Patch list caches in-place — no need to invalidate the whole list for a focusMinutes change
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) => (t.id === data.id ? data : t)),
          };
        },
      );
      options?.onSuccess?.(data, variables, context, mutation);
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
    onMutate: async (body) => {
      if (body.action !== "delete" || !body.ids?.length) return;

      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });

      const deletedIds = new Set(body.ids);
      queryClient.setQueriesData<TasksPage>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          const kept = old.tasks.filter((t) => !deletedIds.has(t.id));
          return { tasks: kept, total: old.total - (old.tasks.length - kept.length) };
        },
      );
    },
    onError: (err, vars, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onError?.(err, vars, context, mutation);
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
