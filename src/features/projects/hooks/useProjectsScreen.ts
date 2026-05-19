"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from "@/app/hooks/useProjectsApi";
import type { Project } from "@/lib/types";
import { useProjectsOptimisticDelete } from "./useProjectsOptimisticDelete";

export function useProjectsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [limit, setLimit] = useState(50);

  const { data: page, isLoading, error } = useProjectsQuery(workspaceId, { limit });
  const projects = page?.projects ?? [];
  const total = page?.total ?? 0;

  const createMutation = useCreateProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project created"),
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project updated"),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteProjectMutation(workspaceId, {
    onSuccess: () => toast.success("Project deleted"),
    onError: (err) => toast.error(err.message),
  });

  const { handleDelete } = useProjectsOptimisticDelete(workspaceId, deleteMutation);

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
