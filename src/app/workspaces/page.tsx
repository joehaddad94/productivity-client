"use client";

import { useWorkspacesPage } from "./useWorkspacesPage";
import { WorkspacesPageView } from "./components/WorkspacesPageView";

export default function WorkspacesPage() {
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
