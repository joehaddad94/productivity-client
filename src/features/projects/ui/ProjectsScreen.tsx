"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, FileText, SquareCheck } from "lucide-react";
import type { Project } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { toast } from "sonner";
import { useProjectsScreen } from "../hooks/useProjectsScreen";

const COLOR_PRESETS = [
  { name: "slate",  border: "border-l-slate-400",  dot: "bg-slate-400"  },
  { name: "blue",   border: "border-l-blue-500",   dot: "bg-blue-500"   },
  { name: "green",  border: "border-l-green-500",  dot: "bg-green-500"  },
  { name: "amber",  border: "border-l-amber-500",  dot: "bg-amber-500"  },
  { name: "red",    border: "border-l-red-500",    dot: "bg-red-500"    },
  { name: "purple", border: "border-l-purple-500", dot: "bg-purple-500" },
  { name: "pink",   border: "border-l-pink-500",   dot: "bg-pink-500"   },
  { name: "orange", border: "border-l-orange-500", dot: "bg-orange-500" },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  active:    { label: "Active",    dot: "bg-green-500"  },
  on_hold:   { label: "On hold",   dot: "bg-amber-500"  },
  completed: { label: "Completed", dot: "bg-slate-400"  },
};

function colorBorder(color?: string | null) {
  return COLOR_PRESETS.find((c) => c.name === color)?.border ?? "border-l-border/40";
}

function colorDot(color?: string | null) {
  return COLOR_PRESETS.find((c) => c.name === color)?.dot;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const dot = colorDot(project.color);
  return (
    <div
      data-testid="project-card"
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border border-border/60 border-l-4 bg-card hover:border-primary/30 transition-colors",
        colorBorder(project.color),
      )}
    >
      {/* Action buttons — hover only */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          aria-label="Edit project"
          onClick={(e) => { e.preventDefault(); onEdit(project); }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          aria-label="Delete project"
          onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Clickable area → detail page */}
      <Link href={`/projects/${project.id}`} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={cn("size-2.5 rounded-full", dot ?? "bg-primary/40")} />
          <p className="text-sm font-medium flex-1 pr-12">{project.name}</p>
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <SquareCheck className="size-3" />
              {project._count?.tasks ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              {project._count?.notes ?? 0}
            </span>
          </div>
          <StatusBadge status={project.status ?? "active"} />
        </div>
      </Link>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (color: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          "size-5 rounded-full border-2 bg-muted transition-colors",
          !value ? "border-foreground" : "border-transparent hover:border-muted-foreground",
        )}
        aria-label="No color"
      />
      {COLOR_PRESETS.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() => onChange(c.name)}
          className={cn(
            "size-5 rounded-full border-2 transition-colors",
            c.dot,
            value === c.name ? "border-foreground" : "border-transparent hover:border-muted-foreground",
          )}
          aria-label={c.name}
        />
      ))}
    </div>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial: { name: string; description?: string; status?: string; color?: string };
  onSubmit: (data: { name: string; description: string; status: string; color?: string }) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState(initial.status ?? "active");
  const [color, setColor] = useState<string | undefined>(initial.color ?? undefined);

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); if (name.trim()) onSubmit({ name: name.trim(), description, status, color }); }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Project name…"
        aria-label="Project name"
        className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
        autoFocus
        disabled={isPending}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        className="w-full text-xs bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 text-muted-foreground"
        disabled={isPending}
      />
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={status} onValueChange={setStatus} disabled={isPending}>
          <SelectTrigger size="sm" className="text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => { if (name.trim()) onSubmit({ name: name.trim(), description, status, color }); }}
          disabled={isPending || !name.trim()}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {submitLabel}
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

  const inputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <ScreenSkeleton variant="projects" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        {!showCreate && (
          <Button
            size="sm"
            onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            disabled={!workspaceId}
          >
            <Plus className="size-3.5" />
            New project
          </Button>
        )}
      </div>

      {/* Inline create */}
      {showCreate && (
        <ProjectForm
          initial={{ name: "" }}
          submitLabel="Create project"
          isPending={createMutation.isPending}
          onCancel={() => setShowCreate(false)}
          onSubmit={({ name, description, status, color }) => {
            createMutation.mutate({ name, description: description || undefined, status, color });
          }}
        />
      )}

      {error && <p className="text-sm text-destructive text-center py-8">Failed to load projects</p>}

      {!error && projects.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowCreate(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            disabled={!workspaceId}
          >
            <Plus className="size-3.5" />
            Create your first project
          </Button>
        </div>
      )}

      {!error && projects.length > 0 && (
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
                  onSubmit={({ name, description, status, color }) =>
                    updateMutation.mutate({
                      id: project.id,
                      body: { name, description: description || undefined, status, color },
                    })
                  }
                />
              ) : (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditing}
                  onDelete={handleDelete}
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
    </div>
  );
}
