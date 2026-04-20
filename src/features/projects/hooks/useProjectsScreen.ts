"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  PROJECTS_QUERY_KEY,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from "@/app/hooks/useProjectsApi";
import type { Project } from "@/lib/types";
import type { ProjectsPage } from "@/lib/api/projects-api";

export function useProjectsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [limit, setLimit] = useState(50);

  const { data: page, isLoading, error } = useProjectsQuery(workspaceId, { limit });
  const projects = page?.projects ?? [];
  const total = page?.total ?? 0;

  const projectsFilter = { queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") };

  // ── Create ──────────────────────────────────────────────────────────────────
  const createMutation = useCreateProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project created"),
    onError: (err) => toast.error(err.message),
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  const updateMutation = useUpdateProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project updated"),
    onError: (err) => toast.error(err.message),
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project deleted"),
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries(projectsFilter);
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      // Optimistic removal
      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter,
        (old) =>
          old
            ? { projects: old.projects.filter((p) => p.id !== id), total: old.total - 1 }
            : old,
      );
      deleteMutation.mutate(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, workspaceId, deleteMutation],
  );

  return {
    workspaceId,
    showCreate,
    setShowCreate,
    editing,
    setEditing,
    projects,
    total,
    isLoading,
    error,
    createMutation,
    updateMutation,
    handleDelete,
    handleLoadMore: () => setLimit((l) => l + 50),
  };
}
