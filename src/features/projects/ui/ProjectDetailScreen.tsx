"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Task } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { ScreenLoader } from "@/app/components/ScreenLoader";
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
    updateMutation,
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
    return <ScreenLoader variant="app" />;
  }

  if (!project) {
    return <ProjectDetailNotFound onBack={() => router.replace("/projects")} />;
  }

  const taskCount = tasks.length;
  const noteCount = notes.length;

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
          handleBulkDelete={handleBulkDelete}
          bulkTaskPending={bulkTaskMutation.isPending}
          onBulkDeleteDone={() => {
            setDrawerOpen(false);
            setDrawerTask(null);
          }}
          updateTaskMutate={updateTaskMutation.mutate}
          openTask={openTask}
        />
      )}

      {activeTab === "notes" && (
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
        onConfirm={handleDelete}
      />
    </div>
  );
}
