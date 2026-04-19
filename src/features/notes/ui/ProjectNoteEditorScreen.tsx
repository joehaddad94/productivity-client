"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { useProjectQuery } from "@/app/hooks/useProjectsApi";
import { useProjectNoteEditorScreen } from "../hooks/useProjectNoteEditorScreen";
import { NoteEditor } from "./NoteEditor";

export function ProjectNoteEditorScreen({
  projectId,
  noteId,
}: {
  projectId: string;
  noteId: string;
}) {
  const {
    workspaceId,
    note,
    isLoading,
    isError,
    projectMismatch,
    existingTagLabels,
    allTasks,
    tasksLoading,
    ensureTasksLoaded,
    updateIsPending,
    linkingTaskNoteIds,
    convertingNoteIds,
    handleUpdate,
    handleAddTags,
    handleRemoveTag,
    handleLinkTask,
    handleConvertToTask,
    handleDelete,
    deleteIsPending,
  } = useProjectNoteEditorScreen(projectId, noteId);

  const { data: project } = useProjectQuery(workspaceId, projectId);

  if (isLoading) {
    return <ScreenSkeleton variant="notes" />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-muted-foreground">Failed to load note</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-muted-foreground">Note not found</p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>
    );
  }

  if (projectMismatch) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 px-4 text-center max-w-md mx-auto">
        <p className="text-sm text-muted-foreground">
          This note isn&apos;t part of this project. Open it from the main Notes page or the project it belongs to.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/projects/${projectId}`}>Back to project</Link>
        </Button>
      </div>
    );
  }

  const backLabel = project?.name ? `Back to ${project.name}` : "Back to project";

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] lg:h-screen -m-5 lg:-m-6">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-[var(--sidebar-bg)] shrink-0">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="truncate">{backLabel}</span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive shrink-0 gap-1.5"
          onClick={handleDelete}
          disabled={deleteIsPending}
        >
          {deleteIsPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-background">
        <NoteEditor
          note={note}
          existingTags={existingTagLabels}
          onUpdate={handleUpdate}
          onAddTags={handleAddTags}
          onRemoveTag={handleRemoveTag}
          onLinkTask={handleLinkTask}
          onOpenTaskPicker={ensureTasksLoaded}
          isLinkingTask={linkingTaskNoteIds.has(note.id)}
          onConvertToTask={handleConvertToTask}
          isConvertingToTask={convertingNoteIds.has(note.id)}
          isSaving={updateIsPending}
          tasksLoading={tasksLoading}
          tasks={allTasks}
        />
      </div>
    </div>
  );
}
