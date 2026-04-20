"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { PROJECTS_QUERY_KEY } from "@/app/hooks/useProjectsApi";
import type { ProjectsPage } from "@/lib/api/projects-api";

export function useProjectsOptimisticDelete(
  workspaceId: string | null,
  deleteMutation: UseMutationResult<void, Error, string, unknown>,
) {
  const queryClient = useQueryClient();
  const projectsFilter = { queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") };

  const handleDelete = useCallback(
    (id: string) => {
      queryClient.setQueriesData<ProjectsPage>(projectsFilter, (old) =>
        old ? { projects: old.projects.filter((p) => p.id !== id), total: old.total - 1 } : old,
      );
      deleteMutation.mutate(id);
    },
    [queryClient, workspaceId, deleteMutation],
  );

  return { handleDelete };
}
