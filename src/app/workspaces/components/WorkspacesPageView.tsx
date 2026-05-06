"use client";

import { Plus } from "lucide-react";
import type { Workspace } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/components/ui/utils";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { WorkspacesCreateForm } from "./WorkspacesCreateForm";
import { WorkspaceCard } from "./WorkspaceCard";

export interface WorkspacesPageViewProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspaceId: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showCreate: boolean;
  onShowCreateChange: (show: boolean) => void;
  editing: Workspace | null;
  onEditingChange: (ws: Workspace | null) => void;
  workspaceToDelete: Workspace | null;
  onWorkspaceToDeleteChange: (ws: Workspace | null) => void;
  filteredWorkspaces: Workspace[];
  createMutation: { isPending: boolean; mutateAsync: (data: { name: string; slug?: string; isPersonal: boolean }) => Promise<Workspace> };
  updateMutation: { isPending: boolean; mutateAsync: (args: { id: string; body: { name?: string; slug?: string; isPersonal?: boolean } }) => Promise<Workspace> };
  deleteMutation: { isPending: boolean; mutate: (id: string) => void };
  onCreateSubmit: (data: { name: string; slug?: string; isPersonal: boolean }) => Promise<void>;
  onUpdateSubmit: (ws: Workspace, data: { name?: string; slug?: string; isPersonal?: boolean }) => Promise<void>;
  onDeleteConfirm: () => void;
}

export function WorkspacesPageView({
  workspaces,
  currentWorkspace,
  setCurrentWorkspaceId,
  searchQuery,
  onSearchChange,
  showCreate,
  onShowCreateChange,
  editing,
  onEditingChange,
  workspaceToDelete,
  onWorkspaceToDeleteChange,
  filteredWorkspaces,
  createMutation,
  updateMutation,
  deleteMutation,
  onCreateSubmit,
  onUpdateSubmit,
  onDeleteConfirm,
}: WorkspacesPageViewProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Manage workspaces
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create, switch, edit, or delete workspaces. Each workspace keeps its own tasks and settings.
            </p>
            {currentWorkspace && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Current: <span className="font-medium text-gray-700 dark:text-gray-300">{currentWorkspace.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        type="search"
        placeholder="Search workspaces by name or slug…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search workspaces"
      />

      {/* Create + List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-5 space-y-5">

          {/* Add workspace */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Add workspace
            </h2>
            {!showCreate ? (
              <button
                type="button"
                onClick={() => onShowCreateChange(true)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700",
                  "py-4 text-sm font-medium text-gray-600 dark:text-gray-400",
                  "hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 transition-colors",
                )}
              >
                <Plus className="size-4" />
                Create workspace
              </button>
            ) : (
              <WorkspacesCreateForm
                onCancel={() => onShowCreateChange(false)}
                onSubmit={onCreateSubmit}
                isPending={createMutation.isPending}
              />
            )}
          </section>

          {/* Workspace list */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Your workspaces
              {workspaces.length > 0 && (
                <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">
                  ({filteredWorkspaces.length}{searchQuery.trim() ? " matching" : " total"})
                </span>
              )}
            </h2>

            <ul className="space-y-2">
              {filteredWorkspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  isCurrentWorkspace={currentWorkspace?.id === ws.id}
                  editing={editing?.id === ws.id}
                  onEdit={() => onEditingChange(ws)}
                  onCancelEdit={() => onEditingChange(null)}
                  onUpdateSubmit={(data) => onUpdateSubmit(ws, data)}
                  onRequestDelete={() => onWorkspaceToDeleteChange(ws)}
                  onSwitch={() => setCurrentWorkspaceId(ws.id)}
                  updateMutation={updateMutation}
                  deleteMutation={deleteMutation}
                  workspaceToDelete={workspaceToDelete}
                />
              ))}
            </ul>

            {workspaces.length === 0 && !showCreate && (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                No workspaces yet. Create one above.
              </p>
            )}
            {workspaces.length > 0 && filteredWorkspaces.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                No workspaces match &quot;{searchQuery.trim()}&quot;.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* About */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          About workspaces
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Workspaces help you separate work, personal, or project-specific tasks.
          Switch using the dropdown in the sidebar. Your current workspace is used for all new tasks.
          Expand any workspace to manage its members and invite collaborators.
        </p>
      </div>

      {/* Delete confirmation — requires typing the workspace name */}
      <ConfirmDialog
        open={!!workspaceToDelete}
        onOpenChange={(open) => !open && onWorkspaceToDeleteChange(null)}
        title="Delete workspace"
        description={`This will permanently delete "${workspaceToDelete?.name}" and all its tasks, projects, and data. This cannot be undone.`}
        confirmText={workspaceToDelete?.name}
        confirmLabel="Delete workspace"
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}
