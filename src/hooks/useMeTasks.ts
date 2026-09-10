"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Task } from "@/lib/types";
import type { Workspace } from "@/lib/types";
import { WORKSPACES_QUERY_KEY } from "@/app/hooks/useWorkspacesApi";
import {
  meApi,
  type MeTask,
  type MeTasksPage,
  type MeTasksListParams,
  type QuickAddBody,
} from "@/lib/api/me-api";
import { TASKS_QUERY_KEY } from "@/app/hooks/useTasksApi";
import { track } from "@/lib/analytics";

/** Placeholder id for a quick-added task that only exists in the cache. */
const OPTIMISTIC_TASK_ID = "__optimistic_me_task__";

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
    // Show the task straight away. The rollup key includes its params, so
    // every lens variant is patched; onSuccess invalidates and the real row
    // replaces the placeholder.
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["me-tasks"] });
      const previous = queryClient.getQueriesData<MeTasksPage>({
        queryKey: ["me-tasks"],
      });

      const workspaces =
        queryClient.getQueryData<Workspace[]>(WORKSPACES_QUERY_KEY) ?? [];
      const ws =
        workspaces.find((w) => w.id === body.workspaceId) ??
        workspaces.find((w) => w.isPersonal) ??
        workspaces[0];

      const optimistic: MeTask = {
        id: OPTIMISTIC_TASK_ID,
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate ?? null,
        dueTime: body.dueTime ?? null,
        priority: body.priority ?? null,
        status: "",
        statusName: null,
        statusColor: null,
        canonicalBucket: "open",
        completedAt: null,
        parentTaskId: null,
        createdAt: new Date().toISOString(),
        workspace: ws
          ? { id: ws.id, name: ws.name, isPersonal: ws.isPersonal }
          : { id: "", name: "", isPersonal: true },
        project: null,
        assignees: [],
      };

      queryClient.setQueriesData<MeTasksPage>({ queryKey: ["me-tasks"] }, (old) =>
        old ? { tasks: [optimistic, ...old.tasks], total: old.total + 1 } : old,
      );
      return { previous };
    },
    onError: (err, variables, context, mutation) => {
      const previous = (
        context as { previous?: [readonly unknown[], MeTasksPage | undefined][] } | undefined
      )?.previous;
      // Restore each rollup cache exactly as it was.
      previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      options?.onError?.(err, variables, context, mutation);
    },
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
