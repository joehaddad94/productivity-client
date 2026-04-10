"use client";

import { useWorkspacesPage } from "@/app/workspaces/useWorkspacesPage";
import { WorkspacesPageView } from "@/app/workspaces/components/WorkspacesPageView";

export function WorkspacesScreen() {
  const {
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
  } = useWorkspacesPage();

  return (
    <WorkspacesPageView
      workspaces={workspaces}
      currentWorkspace={currentWorkspace}
      setCurrentWorkspaceId={setCurrentWorkspaceId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showCreate={showCreate}
      onShowCreateChange={setShowCreate}
      editing={editing}
      onEditingChange={setEditing}
      workspaceToDelete={workspaceToDelete}
      onWorkspaceToDeleteChange={setWorkspaceToDelete}
      filteredWorkspaces={filteredWorkspaces}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      onCreateSubmit={handleCreateSubmit}
      onUpdateSubmit={handleUpdateSubmit}
      onDeleteConfirm={handleDeleteConfirm}
    />
  );
}
