"use client";

import { useRef, useState } from "react";
import { Plus, FolderOpen, WifiOff } from "lucide-react";
import type { Project } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { useProjectsScreen } from "../hooks/useProjectsScreen";
import { ProjectCard } from "./projects-screen/ProjectCard";
import { ProjectForm } from "./projects-screen/ProjectForm";

export function ProjectsScreen() {
  const {
    workspaceId,
    showCreate,
    setShowCreate,
    editing,
    setEditing,
    projects,
    total,
    error,
    createMutation,
    updateMutation,
    handleDelete,
    handleLoadMore,
  } = useProjectsScreen();

  const inputRef = useRef<HTMLInputElement>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        {!showCreate && (
          <Button
            size="sm"
            onClick={() => {
              setShowCreate(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            disabled={!workspaceId}
          >
            <Plus className="size-3.5" />
            New project
          </Button>
        )}
      </div>

      {showCreate && (
        <ProjectForm
          initial={{ name: "" }}
          submitLabel="Create project"
          isPending={createMutation.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={({ name, description, status, color }) => {
            setShowCreate(false);
            createMutation.mutate({
              name,
              description: description || undefined,
              status,
              color,
            });
          }}
        />
      )}

      {error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <WifiOff className="h-7 w-7 opacity-40" />
          <p className="text-sm font-medium">
            {!navigator.onLine ? "You're offline" : "Failed to load projects"}
          </p>
          <p className="text-xs opacity-60">
            {!navigator.onLine
              ? "Connect to the internet to load your projects"
              : "Check your connection and try again"}
          </p>
        </div>
      )}

      {!error && projects.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowCreate(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            disabled={!workspaceId}
          >
            <Plus className="size-3.5" />
            Create your first project
          </Button>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {projects.map((project) =>
              editing?.id === project.id ? (
                <ProjectForm
                  key={project.id}
                  initial={{
                    name: project.name,
                    description: project.description ?? "",
                    status: project.status ?? "active",
                    color: project.color ?? undefined,
                  }}
                  submitLabel="Save"
                  isPending={updateMutation.isPending}
                  onCancel={() => setEditing(null)}
                  onSubmit={({ name, description, status, color }) => {
                    setEditing(null);
                    updateMutation.mutate({
                      id: project.id,
                      body: { name, description: description || undefined, status, color },
                    });
                  }}
                />
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditing}
                  onDelete={setProjectToDelete}
                />
              ),
            )}
          </div>

          {projects.length < total && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-muted-foreground">
                Load more ({projects.length} / {total})
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null);
        }}
        title={`Delete "${projectToDelete?.name}"?`}
        description="This will permanently delete the project and all of its tasks and notes. This action cannot be undone."
        confirmLabel="Delete project"
        confirmText={projectToDelete?.name}
        onConfirm={() => {
          if (projectToDelete) handleDelete(projectToDelete.id);
          setProjectToDelete(null);
        }}
      />
    </div>
  );
}
