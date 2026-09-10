"use client";

/**
 * Cross-workspace task plumbing for the personal rollup surfaces.
 *
 * The workspace-scoped hooks in `useTasksApi` bind a single `workspaceId` at
 * call time, which is exactly what a team board wants and exactly what a
 * cross-workspace view cannot use: rows on Home and the Calendar come from
 * several workspaces at once, so the workspace has to travel with each
 * mutation instead. See docs/task-model-and-rollup.md §4.
 */

import { useCallback, useMemo } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import type { MeTask } from "@/lib/api/me-api";
import { tasksApi, type UpdateTaskBody } from "@/lib/api/tasks-api";
import { taskStatusesApi } from "@/lib/api/task-statuses-api";
import { getDefaultTaskStatuses } from "@/features/tasks/lib/taskStatusDefaults";
import { TASK_STATUSES_QUERY_KEY } from "@/app/hooks/useTaskStatusesApi";
import { TASKS_QUERY_KEY } from "@/app/hooks/useTasksApi";
import { useWorkspace } from "@/app/context/WorkspaceContext";

/**
 * Task statuses for every workspace the user belongs to, keyed by workspace id.
 *
 * A rollup row can only be toggled if we know which status id means "done" in
 * *its own* workspace, and each workspace defines its own vocabulary (§6.1).
 * Shares `TASK_STATUSES_QUERY_KEY` and the 10 minute staleTime with the
 * single-workspace hook, so a workspace already loaded by a team screen is
 * reused rather than refetched.
 */
export function useAllWorkspaceTaskStatuses(): Map<string, TaskStatusDefinition[]> {
  const { workspaces } = useWorkspace();

  const results = useQueries({
    queries: workspaces.map((w) => ({
      queryKey: TASK_STATUSES_QUERY_KEY(w.id),
      queryFn: async () => {
        try {
          const rows = await taskStatusesApi.list(w.id);
          if (rows.length > 0) return rows;
        } catch {
          /* fall through to the built-in defaults */
        }
        return getDefaultTaskStatuses(w.id);
      },
      staleTime: 10 * 60_000,
    })),
  });

  // `results` is positionally aligned with `workspaces`. Key the memo on a
  // scalar built from the query timestamps so it only rebuilds when a
  // workspace's statuses actually change, not on every render.
  const stamp = results.map((r) => r.dataUpdatedAt).join(",");
  return useMemo(() => {
    const map = new Map<string, TaskStatusDefinition[]>();
    workspaces.forEach((w, i) => {
      map.set(w.id, results[i]?.data ?? getDefaultTaskStatuses(w.id));
    });
    return map;
    // `stamp` stands in for `results`, which is a fresh array each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces, stamp]);
}

/**
 * Render a rollup task through the same components the team boards use.
 *
 * `MeTask` carries its workspace and project as nested objects; `Task` carries
 * them as flat ids. Fields the rollup does not return (subtasks, sortOrder,
 * recurrence) are left undefined rather than faked — every consumer treats
 * them as optional.
 */
export function meTaskToTask(t: MeTask): Task {
  return {
    id: t.id,
    workspaceId: t.workspace.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    priority: t.priority,
    status: t.status,
    parentTaskId: t.parentTaskId,
    projectId: t.project?.id ?? null,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
  };
}

type UpdateArgs = { workspaceId: string; id: string; body: UpdateTaskBody };
type DeleteArgs = { workspaceId: string; id: string };

/**
 * Update/delete that take the workspace per call instead of per hook, and
 * invalidate both the rollup and the owning workspace's board so the change
 * shows up wherever the task is visible.
 */
export function useCrossWorkspaceTaskMutations() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (workspaceId: string) => {
      void queryClient.invalidateQueries({ queryKey: ["me-tasks"] });
      void queryClient.invalidateQueries({
        queryKey: TASKS_QUERY_KEY(workspaceId),
      });
    },
    [queryClient],
  );

  const updateMutation = useMutation({
    mutationFn: ({ workspaceId, id, body }: UpdateArgs) =>
      tasksApi.update(workspaceId, id, body),
    onSettled: (_d, _e, vars) => invalidate(vars.workspaceId),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ workspaceId, id }: DeleteArgs) =>
      tasksApi.delete(workspaceId, id),
    onSettled: (_d, _e, vars) => invalidate(vars.workspaceId),
  });

  return { updateMutation, deleteMutation };
}
