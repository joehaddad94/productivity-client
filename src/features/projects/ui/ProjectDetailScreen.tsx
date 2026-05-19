"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, WifiOff } from "lucide-react";
import type { Task } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import { TaskDrawer } from "@/features/tasks/ui/TaskDrawer";
import { useProjectDetailScreen } from "../hooks/useProjectDetailScreen";
import { ProjectDetailHeader } from "./project-detail/ProjectDetailHeader";
import { ProjectDetailNotFound } from "./project-detail/ProjectDetailNotFound";
import { ProjectDetailNotesPanel } from "./project-detail/ProjectDetailNotesPanel";
import { ProjectDetailTabBar } from "./project-detail/ProjectDetailTabBar";
import { ProjectDetailTasksPanel } from "./project-detail/ProjectDetailTasksPanel";
import { ProjectDetailTopBar } from "./project-detail/ProjectDetailTopBar";

export function ProjectDetailScreen({
  projectId,
  initialTab = "tasks",
}: {
  projectId: string;
  initialTab?: "tasks" | "notes";
}) {
  const router = useRouter();
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const {
    workspaceId,
    project,
    projectLoading,
    projectError,
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
    updateMutation,
    deleteMutation,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    bulkTaskMutation,
    handleSaveName,
    handleSaveDescription,
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
    taskStatuses,
  } = useProjectDetailScreen(projectId, { initialTab });

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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/projects"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </div>
        <div className="space-y-2">
          <div className="h-8 w-1/3 rounded bg-muted/40 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="h-10 border-b border-border/50" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (projectError && !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
        <WifiOff className="h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">
          {!navigator.onLine ? "You're offline" : "Failed to load project"}
        </p>
        <p className="text-xs opacity-60">
          {!navigator.onLine
            ? "Connect to the internet to view this project"
            : "Check your connection and try again"}
        </p>
      </div>
    );
  }

  if (!project) {
    return <ProjectDetailNotFound onBack={() => router.replace("/projects")} />;
  }

  const taskCount = project._count?.tasks ?? tasks.length;
  const noteCount = project._count?.notes ?? notes.length;

  return (
    <div className="space-y-6">
      <ProjectDetailTopBar onDeleteClick={() => setConfirmDeleteOpen(true)} />

      <ProjectDetailHeader
        project={project}
        onSaveName={handleSaveName}
        onSaveDescription={handleSaveDescription}
        onStatusChange={(value) =>
          updateMutation.mutate({ id: project.id, body: { status: value } })
        }
        isSaving={updateMutation.isPending}
      />

      <ProjectDetailTabBar
        projectId={projectId}
        router={router}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taskCount={taskCount}
        noteCount={noteCount}
        isSelectMode={isSelectMode}
        setIsSelectMode={setIsSelectMode}
        setSelectedIds={setSelectedIds}
      />

      {activeTab === "tasks" && (
        <div role="tabpanel" id="tabpanel-tasks" aria-labelledby="tab-tasks">
          <ProjectDetailTasksPanel
            tasks={tasks}
            taskStatuses={taskStatuses}
            tasksLoading={tasksLoading}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            handleAddTask={handleAddTask}
            createTaskPending={createTaskMutation.isPending}
            isSelectMode={isSelectMode}
            selectedIds={selectedIds}
            handleToggleSelect={handleToggleSelect}
            onBulkDeleteRequest={() => setConfirmBulkDeleteOpen(true)}
            bulkTaskPending={bulkTaskMutation.isPending}
            updateTaskMutate={updateTaskMutation.mutate}
            openTask={openTask}
          />
        </div>
      )}

      {activeTab === "notes" && (
        <div role="tabpanel" id="tabpanel-notes" aria-labelledby="tab-notes">
          <ProjectDetailNotesPanel
            notes={notes}
            notesLoading={notesLoading}
            newNoteTitle={newNoteTitle}
            setNewNoteTitle={setNewNoteTitle}
            handleAddNote={handleAddNote}
            onOpenNote={(noteId) =>
              router.push(`/projects/${projectId}/notes/${noteId}?fromTab=notes`)
            }
          />
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
        taskStatuses={taskStatuses}
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
        isPending={deleteMutation.isPending}
        preventAutoClose
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={`Delete ${selectedIds.size} task${selectedIds.size !== 1 ? "s" : ""}?`}
        description="This will permanently delete the selected tasks. This action cannot be undone."
        confirmLabel="Delete tasks"
        isPending={bulkTaskMutation.isPending}
        preventAutoClose
        onConfirm={() => {
          handleBulkDelete(() => {
            setConfirmBulkDeleteOpen(false);
            setDrawerOpen(false);
            setDrawerTask(null);
          });
        }}
      />
    </div>
  );
}
