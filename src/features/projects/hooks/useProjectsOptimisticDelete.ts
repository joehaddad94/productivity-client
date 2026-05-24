"use client";

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationResult } from "@tanstack/react-query";
import { PROJECTS_QUERY_KEY } from "@/app/hooks/useProjectsApi";
import type { ProjectsPage } from "@/lib/api/projects-api";

export function useProjectsOptimisticDelete(
  workspaceId: string | null,
  deleteMutation: UseMutationResult<void, Error, string, unknown>,
) {
  const queryClient = useQueryClient();
  const projectsFilter = { queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") };
  const snapshotRef = useRef<[QueryKey, ProjectsPage | undefined][]>([]);

  const handleDelete = useCallback(
    (id: string) => {
      snapshotRef.current = queryClient.getQueriesData<ProjectsPage>(projectsFilter);
      queryClient.setQueriesData<ProjectsPage>(projectsFilter, (old) =>
        old ? { projects: old.projects.filter((p) => p.id !== id), total: old.total - 1 } : old,
      );
      deleteMutation.mutate(id, {
        onError: () => {
          snapshotRef.current.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
      });
    },
    [queryClient, workspaceId, deleteMutation],
  );

  return { handleDelete };
}
