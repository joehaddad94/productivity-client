"use client";

import { useState, useMemo } from "react";
import type { Workspace } from "@/lib/types";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  WORKSPACES_QUERY_KEY,
} from "@/app/hooks/useWorkspacesApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useWorkspacesPage() {
  const queryClient = useQueryClient();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    refetchWorkspaces,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  const filteredWorkspaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.slug && w.slug.toLowerCase().includes(q))
    );
  }, [workspaces, searchQuery]);

  const createMutation = useCreateWorkspaceMutation({
    onSuccess: (workspace) => {
      setCurrentWorkspaceId(workspace.id);
      refetchWorkspaces();
    },
  });

  const updateMutation = useUpdateWorkspaceMutation({
    onSuccess: () => {
      setEditing(null);
      refetchWorkspaces();
    },
  });

  const deleteMutation = useDeleteWorkspaceMutation({
    onSuccess: (_, id) => {
      setWorkspaceToDelete(null);
      if (currentWorkspace?.id === id) {
        const list =
          queryClient.getQueryData<Workspace[]>(WORKSPACES_QUERY_KEY) ?? [];
        setCurrentWorkspaceId(list[0]?.id ?? null);
      }
      toast.success("Workspace deleted");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCreateSubmit = async (data: {
    name: string;
    slug?: string;
    isPersonal: boolean;
  }) => {
    setShowCreate(false);
    try {
      await createMutation.mutateAsync(data);
      toast.success("Workspace created");
    } catch (err) {
      setShowCreate(true);
      toast.error(
        err instanceof Error ? err.message : "Failed to create workspace"
      );
    }
  };

  const handleUpdateSubmit = async (
    ws: Workspace,
    data: { name?: string; slug?: string; isPersonal?: boolean }
  ) => {
    try {
      await updateMutation.mutateAsync({ id: ws.id, body: data });
      toast.success("Workspace updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update workspace"
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (workspaceToDelete) {
      deleteMutation.mutate(workspaceToDelete.id);
    }
  };

  return {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    searchQuery,
    setSearchQuery,
    showCreate,
    setShowCreate,
    editing,
    setEditing,
    workspaceToDelete,
    setWorkspaceToDelete,
    filteredWorkspaces,
    createMutation,
    updateMutation,
    deleteMutation,
    handleCreateSubmit,
    handleUpdateSubmit,
    handleDeleteConfirm,
  };
}
