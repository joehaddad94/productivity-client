"use client";

import Link from "next/link";
import { Pencil, Trash2, FileText, SquareCheck, RefreshCw } from "lucide-react";
import type { Project } from "@/lib/types";
import { cn } from "@/app/components/ui/utils";
import { projectCardColorBorder, projectCardColorDot } from "../../lib/projectListUi";
import { ProjectCardStatusBadge } from "./StatusBadge";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const dot = projectCardColorDot(project.color);
  const isSaving = project.id.startsWith("temp_");

  const cardContent = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2.5 rounded-full", dot ?? "bg-primary/40")} />
        <p className="text-sm font-medium flex-1 pr-12">{project.name}</p>
        {isSaving && <RefreshCw className="size-3 text-muted-foreground animate-spin shrink-0" />}
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
        <ProjectCardStatusBadge status={project.status ?? "active"} />
      </div>
    </div>
  );

  return (
    <div
      data-testid="project-card"
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border border-border/60 border-l-4 bg-card transition-colors",
        projectCardColorBorder(project.color),
        isSaving ? "opacity-70 cursor-default" : "hover:border-primary/30",
      )}
    >
      {!isSaving && (
        <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            aria-label="Edit project"
            onClick={(e) => {
              e.preventDefault();
              onEdit(project);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete project"
            onClick={(e) => {
              e.preventDefault();
              onDelete(project);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {isSaving ? (
        cardContent
      ) : (
        <Link href={`/projects/${project.id}`} className="flex flex-col gap-3">
          {cardContent}
        </Link>
      )}
    </div>
  );
}
