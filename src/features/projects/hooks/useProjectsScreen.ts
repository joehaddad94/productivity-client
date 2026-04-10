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

export function useProjectsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [limit, setLimit] = useState(50);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data: page, isLoading, error } = useProjectsQuery(workspaceId, { limit });
  const projects = page?.projects ?? [];
  const total = page?.total ?? 0;

  const createMutation = useCreateProjectMutation(workspaceId, {
    onSuccess: () => {
      setShowCreate(false);
      toast.success("Project created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateProjectMutation(workspaceId, {
    onSuccess: () => {
      setEditing(null);
      toast.success("Project updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteProjectMutation(workspaceId, {
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") });
    },
  });

  const handleDelete = useCallback((id: string) => {
    queryClient.setQueriesData<{ projects: Project[]; total: number }>(
      { queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") },
      (old) => old ? { projects: old.projects.filter((p) => p.id !== id), total: old.total - 1 } : old
    );

    const timer = setTimeout(() => {
      pendingDeletes.current.delete(id);
      deleteMutation.mutate(id);
    }, 5000);
    pendingDeletes.current.set(id, timer);

    toast.success("Project deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          const t = pendingDeletes.current.get(id);
          if (t !== undefined) clearTimeout(t);
          pendingDeletes.current.delete(id);
          queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY(workspaceId ?? "") });
        },
      },
    });
  }, [queryClient, workspaceId, deleteMutation]);

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
    deleteMutation,
    handleDelete,
    handleLoadMore: () => setLimit((l) => l + 50),
  };
}
