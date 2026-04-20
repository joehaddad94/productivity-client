"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  FolderOpen,
} from "lucide-react";
import type { Task } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { TaskCard } from "@/app/components/TaskCard";
import { NoteCard } from "@/app/components/NoteCard";
import { TaskDrawer } from "@/features/tasks/ui/TaskDrawer";
import { useProjectDetailScreen } from "../hooks/useProjectDetailScreen";

const COLOR_DOT: Record<string, string> = {
  slate:  "bg-slate-400",
  blue:   "bg-blue-500",
  green:  "bg-green-500",
  amber:  "bg-amber-500",
  red:    "bg-red-500",
  purple: "bg-purple-500",
  pink:   "bg-pink-500",
  orange: "bg-orange-500",
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; next: string }> = {
  active:    { label: "Active",    dot: "bg-green-500", next: "On hold"   },
  on_hold:   { label: "On hold",   dot: "bg-amber-500", next: "Completed" },
  completed: { label: "Completed", dot: "bg-slate-400", next: "Active"    },
};

function InlineText({
  value,
  onSave,
  placeholder,
  className,
  multiline,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onSave(draft); setEditing(false); };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn("text-left w-full hover:opacity-70 transition-opacity", className)}
      >
        {value || <span className="text-muted-foreground/50 italic">{placeholder}</span>}
      </button>
    );
  }

  const sharedProps = {
    ref,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    className: cn("w-full bg-transparent outline-none border-b border-primary/40 pb-0.5", className),
  };

  return multiline ? (
    <textarea {...sharedProps} rows={3} onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }} />
  ) : (
    <input
      {...sharedProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
    />
  );
}

export function ProjectDetailScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const {
    workspaceId,
    project,
    projectLoading,
    tasks,
    tasksLoading,
    notes,
    notesLoading,
    activeTab,
    setActiveTab,
    newTaskTitle,
    setNewTaskTitle,
    newNoteTitle,
    setNewNoteTitle,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    bulkTaskMutation,
    handleSaveName,
    handleSaveDescription,
    handleCycleStatus,
    handleAddTask,
    handleToggleSubtask,
    handleToggleSelect,
    handleBulkDelete,
    handleDeleteTask,
    handleAddNote,
    handleDelete,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
  } = useProjectDetailScreen(projectId);

  function openTask(task: Task) {
    setDrawerTask(task);
    setDrawerOpen(true);
  }

  function handleSaveDrawer(id: string, body: UpdateTaskBody) {
    updateTaskMutation.mutate(
      { id, body },
      {
        onSuccess: (updated) => {
          if (updated) setDrawerTask(updated);
          toast.success("Task updated");
        },
      },
    );
  }

  function handleDeleteDrawer(id: string) {
    handleDeleteTask(id);
    setDrawerOpen(false);
    setDrawerTask(null);
  }

  if (projectLoading) {
    return <ScreenLoader variant="app" />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FolderOpen className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => router.replace("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const dot = COLOR_DOT[project.color ?? ""] ?? "bg-primary/30";
  const statusCfg = STATUS_CONFIG[project.status ?? "active"] ?? STATUS_CONFIG.active;
  const taskCount = tasks.length;
  const noteCount = notes.length;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Projects
        </Link>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="size-3.5" />
          Delete project
        </button>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={cn("size-3 rounded-full flex-shrink-0", dot)} />
          <InlineText
            value={project.name}
            onSave={handleSaveName}
            placeholder="Project name"
            className="text-2xl font-semibold tracking-tight flex-1"
          />
          <button
            onClick={handleCycleStatus}
            title={`Click to set: ${statusCfg.next}`}
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors flex-shrink-0"
          >
            <span className={cn("size-2 rounded-full", statusCfg.dot)} />
            {statusCfg.label}
          </button>
        </div>
        <InlineText
          value={project.description ?? ""}
          onSave={handleSaveDescription}
          placeholder="Add a description…"
          className="text-sm text-muted-foreground"
          multiline
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border/50">
        {(["tasks", "notes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "tasks" ? (
              <span className="flex items-center gap-1.5">Tasks {taskCount > 0 && <span className="text-xs text-muted-foreground">({taskCount})</span>}</span>
            ) : (
              <span className="flex items-center gap-1.5">Notes {noteCount > 0 && <span className="text-xs text-muted-foreground">({noteCount})</span>}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex gap-2 items-start">
            <Button
              type="button"
              variant={isSelectMode ? "secondary" : "ghost"}
              size="sm"
              className="shrink-0 h-9"
              onClick={() => {
                setIsSelectMode((p) => !p);
                setSelectedIds(new Set());
              }}
              disabled={!workspaceId}
            >
              {isSelectMode ? "Cancel" : "Select"}
            </Button>
            <div className="flex gap-2 flex-1 min-w-0">
              <input
                type="text"
                placeholder="Add a task and press Enter…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isSelectMode && handleAddTask()}
                disabled={createTaskMutation.isPending || isSelectMode}
                className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending || isSelectMode}
              >
                {createTaskMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Add
              </Button>
            </div>
          </div>

          {isSelectMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() =>
                  handleBulkDelete(() => {
                    setDrawerOpen(false);
                    setDrawerTask(null);
                  })
                }
                disabled={bulkTaskMutation.isPending}
              >
                {bulkTaskMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          )}

          {tasksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground/60">Add a task above to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showCheckbox={false}
                  selectionMode={isSelectMode}
                  selected={selectedIds.has(task.id)}
                  onToggleSelect={handleToggleSelect}
                  onSelect={openTask}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          {/* Quick-add */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New note title and press Enter…"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground transition-colors"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddNote}
              disabled={!newNoteTitle.trim()}
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>

          {notesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <FileText className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notes yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSelect={() => router.push(`/projects/${projectId}/notes/${note.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TaskDrawer
        task={drawerTask}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setDrawerTask(null);
        }}
        onSave={handleSaveDrawer}
        onDelete={handleDeleteDrawer}
        onToggleSubtask={handleToggleSubtask}
        workspaceId={workspaceId}
        isSaving={updateTaskMutation.isPending}
        isDeleting={deleteTaskMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete "${project?.name}"?`}
        description="This will permanently delete the project and all of its tasks and notes. This action cannot be undone."
        confirmLabel="Delete project"
        confirmText={project?.name}
        onConfirm={handleDelete}
      />
    </div>
  );
}
