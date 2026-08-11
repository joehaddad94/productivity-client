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
  meApi,
  type MeTasksPage,
  type MeTasksListParams,
  type QuickAddBody,
} from "@/lib/api/me-api";
import { TASKS_QUERY_KEY } from "@/app/hooks/useTasksApi";
import { track } from "@/lib/analytics";

export const ME_TASKS_QUERY_KEY = (params?: MeTasksListParams) =>
  ["me-tasks", params ?? {}] as const;

export function useMeTasksQuery(
  params?: MeTasksListParams,
  options?: Omit<UseQueryOptions<MeTasksPage>, "queryKey" | "queryFn"> & {
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: ME_TASKS_QUERY_KEY(params),
    queryFn: () => meApi.list(params),
    ...options,
  });
}

export function useQuickAddTaskMutation(
  options?: UseMutationOptions<Task, Error, QuickAddBody>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: QuickAddBody) => meApi.quickAdd(body),
    ...options,
    onSuccess: (task, variables, context, mutation) => {
      // Refresh every rollup lens plus the target workspace's own task list.
      queryClient.invalidateQueries({ queryKey: ["me-tasks"] });
      if (task.workspaceId) {
        queryClient.invalidateQueries({
          queryKey: TASKS_QUERY_KEY(task.workspaceId),
        });
      }
      track("task_created", {
        has_due_date: !!variables.dueDate,
        has_priority: !!variables.priority,
        is_recurring: false,
        has_project: !!variables.projectId,
        has_assignee: true, // rollup quick-add self-assigns
        is_subtask: false,
      });
      if (typeof localStorage !== "undefined" && !localStorage.getItem("ph_first_task")) {
        track("first_task_created", {});
        localStorage.setItem("ph_first_task", "1");
      }
      options?.onSuccess?.(task, variables, context, mutation);
    },
  });
}
