"use client";

import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, FileText } from "lucide-react";
import type { Project } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { toast } from "sonner";
import { useProjectsScreen } from "../hooks/useProjectsScreen";

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      data-testid="project-card"
      className="group flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FolderOpen className="size-4 text-primary" />
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            aria-label="Edit project"
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label="Delete project"
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">{project.name}</p>
        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
          <FileText className="size-3" />
          {project._count?.notes ?? 0} notes
        </div>
      </div>
    </div>
  );
}

function InlineEditForm({
  initialName,
  onSubmit,
  onCancel,
  isPending,
}: {
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initialName);
  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-card">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }
          if (e.key === "Escape") onCancel();
        }}
        aria-label="Project name"
        className="w-full text-sm bg-transparent outline-none mb-3"
        autoFocus
        disabled={isPending}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => { if (name.trim()) onSubmit(name.trim()); }} disabled={isPending || !name.trim()}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function ProjectsScreen() {
  const {
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
    handleLoadMore,
  } = useProjectsScreen();

  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCreate() {
    const name = newName.trim();
    if (!name) { toast.error("Project name is required"); return; }
    createMutation.mutate({ name }, { onSuccess: () => setNewName("") });
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        {!showCreate && (
          <Button size="sm" onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }} disabled={!workspaceId}>
            <Plus className="size-3.5" />
            New project
          </Button>
        )}
      </div>

      {/* Inline create */}
      {showCreate && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-card">
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
              if (e.key === "Escape") { setShowCreate(false); setNewName(""); }
            }}
            aria-label="Project name"
            placeholder="Project name…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
            disabled={createMutation.isPending}
          />
          <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || !newName.trim()}>
            {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Create project
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); }}>Cancel</Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="text-sm text-destructive text-center py-8">Failed to load projects</p>}

      {!isLoading && !error && projects.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
          <Button size="sm" variant="outline" onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }} disabled={!workspaceId}>
            <Plus className="size-3.5" />
            Create your first project
          </Button>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <>
          <div className={cn("grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4")}>
            {projects.map((project) =>
              editing?.id === project.id ? (
                <InlineEditForm
                  key={project.id}
                  initialName={project.name}
                  onSubmit={(name) => updateMutation.mutate({ id: project.id, body: { name } })}
                  onCancel={() => setEditing(null)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <ProjectCard key={project.id} project={project} onEdit={setEditing} onDelete={handleDelete} />
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
    </div>
  );
}
