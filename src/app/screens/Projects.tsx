"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, FileText } from "lucide-react";
import type { Project } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  PROJECTS_QUERY_KEY,
} from "@/app/hooks/useProjectsApi";
import { useQueryClient } from "@tanstack/react-query";

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
    <Card data-testid="project-card" className="border-l-4 border-l-primary/30 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{project.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <FileText className="size-3" />
                <span>{project._count?.notes ?? 0} notes</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              aria-label="Edit project"
              onClick={() => onEdit(project)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              aria-label="Delete project"
              onClick={() => onDelete(project.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectForm({
  initialName,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initialName ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div>
        <Label htmlFor="project-name" className="text-xs font-medium">
          Project Name
        </Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Project"
          autoFocus
          disabled={isPending}
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin mr-1" />
          ) : null}
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function Projects() {
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

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your notes by project
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreate((p) => !p);
            setEditing(null);
          }}
          disabled={!workspaceId}
        >
          <Plus className="size-4 mr-2" />
          New Project
        </Button>
      </div>

      {showCreate && (
        <ProjectForm
          onSubmit={(name) => createMutation.mutate({ name })}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
          submitLabel="Create Project"
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      )}

      {error && (
        <p className="text-center py-8 text-red-500 text-sm">
          Failed to load projects
        </p>
      )}

      {!isLoading && !error && projects.length === 0 && !showCreate && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="size-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              No projects yet
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              disabled={!workspaceId}
            >
              <Plus className="size-3.5 mr-1.5" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              editing?.id === project.id ? (
                <Card key={project.id} className="border-l-4 border-l-primary/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Edit Project</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ProjectForm
                      initialName={project.name}
                      onSubmit={(name) =>
                        updateMutation.mutate({ id: project.id, body: { name } })
                      }
                      onCancel={() => setEditing(null)}
                      isPending={updateMutation.isPending}
                      submitLabel="Save"
                    />
                  </CardContent>
                </Card>
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              )
            ))}
          </div>

          {projects.length < total && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((l) => l + 50)}
              >
                Load more ({projects.length} / {total})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
