"use client";

import {
  Building2,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Workspace } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/components/ui/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { WorkspacesCreateForm } from "./WorkspacesCreateForm";
import { WorkspacesEditForm } from "./WorkspacesEditForm";

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
      {/* Header card */}
      <div key="header" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Manage workspaces
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create, switch, edit, or delete workspaces. Each workspace keeps its own notes and settings.
              </p>
              {currentWorkspace && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Current: <span className="font-medium text-gray-700 dark:text-gray-300">{currentWorkspace.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        key="search"
        type="search"
        placeholder="Search workspaces by name or slug…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search workspaces"
      />

      {/* Create + List in a card */}
      <div key="card" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-5 space-y-5">
          <section key="add-workspace">
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
                  "hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 transition-colors"
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

          <section key="your-workspaces">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Your workspaces
              {workspaces.length > 0 && (
                <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">
                  ({filteredWorkspaces.length}
                  {searchQuery.trim() ? " matching" : " total"})
                </span>
              )}
            </h2>
            <ul className="space-y-2">
              {filteredWorkspaces.map((ws) => (
                <li
                  key={ws.id}
                  className={cn(
                    "rounded-lg border transition-all duration-200",
                    "border-gray-200 dark:border-gray-700",
                    "hover:border-gray-300 dark:hover:border-gray-600",
                    currentWorkspace?.id === ws.id &&
                      "border-l-4 border-l-primary/40 dark:border-l-primary/50 bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  {editing?.id === ws.id ? (
                    <div className="p-4">
                      <WorkspacesEditForm
                        workspace={ws}
                        onCancel={() => onEditingChange(null)}
                        onSubmit={(data) => onUpdateSubmit(ws, data)}
                        isPending={updateMutation.isPending}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4">
                      <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {ws.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {ws.slug || "—"}
                          {ws.isPersonal && " · Personal"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {currentWorkspace?.id === ws.id ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 dark:bg-primary/25 px-2.5 py-1 text-xs font-medium text-primary">
                            <Sparkles className="size-3" />
                            Current
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            className="min-w-[5rem]"
                            onClick={() => setCurrentWorkspaceId(ws.id)}
                          >
                            Switch
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => onEditingChange(ws)}
                          aria-label="Edit workspace"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onWorkspaceToDeleteChange(ws)}
                          disabled={deleteMutation.isPending && workspaceToDelete?.id === ws.id}
                          aria-label="Delete workspace"
                        >
                          {deleteMutation.isPending && workspaceToDelete?.id === ws.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
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

      {/* About / tips */}
      <div key="about" className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          About workspaces
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Workspaces help you separate work, personal, or project-specific notes.
          Switch using the workspace dropdown in the sidebar—your current workspace is used for all new notes and tasks.
        </p>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        key="delete-dialog"
        open={!!workspaceToDelete}
        onOpenChange={(open) => !open && onWorkspaceToDeleteChange(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="space-y-3">
              <AlertDialogTitle className="text-base">
                Delete workspace
              </AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete this workspace. All notes and data in it will be permanently removed.
              </AlertDialogDescription>
              {workspaceToDelete && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Workspace
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {workspaceToDelete.name}
                    </p>
                    {workspaceToDelete.slug && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {workspaceToDelete.slug}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-destructive/90 dark:text-destructive/80">
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-end">
            <AlertDialogCancel key="cancel" disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              key="delete"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={onDeleteConfirm}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                "Delete workspace"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
