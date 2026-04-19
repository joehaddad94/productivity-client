"use client";

import { useCallback, useRef, useState } from "react";
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

  // Map of id → { timer, project snapshot } for pending deletes
  const pendingDeletes = useRef<
    Map<string, { timer: ReturnType<typeof setTimeout>; project: Project }>
  >(new Map());

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
    onError: (err) => {
      toast.error(err.message);
      // Refetch to restore accurate state after a failed delete
      queryClient.invalidateQueries(projectsFilter);
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      // Capture the project before removing it (needed for undo re-insert)
      let captured: Project | undefined;
      const pages = queryClient.getQueriesData<ProjectsPage>(projectsFilter);
      for (const [, data] of pages) {
        captured = data?.projects.find((p) => p.id === id);
        if (captured) break;
      }

      // Optimistic removal
      queryClient.setQueriesData<ProjectsPage>(
        projectsFilter,
        (old) =>
          old
            ? { projects: old.projects.filter((p) => p.id !== id), total: old.total - 1 }
            : old,
      );

      const timer = setTimeout(() => {
        pendingDeletes.current.delete(id);
        deleteMutation.mutate(id);
      }, 5_000);

      if (captured) {
        pendingDeletes.current.set(id, { timer, project: captured });
      }

      toast.success("Project deleted", {
        duration: 5_000,
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingDeletes.current.get(id);
            if (!pending) return;
            clearTimeout(pending.timer);
            pendingDeletes.current.delete(id);

            // Re-insert without hitting the server
            queryClient.setQueriesData<ProjectsPage>(
              projectsFilter,
              (old) => {
                if (!old) return old;
                // Guard against double-insert if undo fires twice
                if (old.projects.some((p) => p.id === id)) return old;
                return {
                  projects: [pending.project, ...old.projects],
                  total: old.total + 1,
                };
              },
            );
          },
        },
      });
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
