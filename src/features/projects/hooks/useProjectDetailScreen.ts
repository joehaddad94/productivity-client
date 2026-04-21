"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "@/app/hooks/useProjectsApi";
import {
  useTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useBulkTasksMutation,
} from "@/app/hooks/useTasksApi";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import type { TaskStatusDefinition } from "@/lib/types";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
} from "@/features/tasks/lib/taskStatusHelpers";

const STATUS_CYCLE: Record<string, string> = {
  active: "on_hold",
  on_hold: "completed",
  completed: "active",
};

export function useProjectDetailScreen(
  projectId: string,
  { initialTab = "tasks" }: { initialTab?: "tasks" | "notes" } = {},
) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const { data: rawTaskStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawTaskStatuses),
    [workspaceId, rawTaskStatuses],
  );

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">(initialTab);
  const [editingField, setEditingField] = useState<"name" | "description" | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: project, isLoading: projectLoading } = useProjectQuery(workspaceId, projectId, {
    enabled: !projectId.startsWith("temp_"),
  });

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(
    workspaceId,
    { projectId, limit: 100 },
  );
  const tasks = tasksPage?.tasks ?? [];

  const { data: notesPage, isLoading: notesLoading } = useNotesQuery(
    workspaceId,
    { projectId, limit: 100 },
  );
  const notes = notesPage?.notes ?? [];

  const updateMutation = useUpdateProjectMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteProjectMutation(workspaceId, {
    onSuccess: () => {
      toast.success("Project deleted");
      router.replace("/projects");
    },
    onError: (err) => toast.error(err.message),
  });

  const createTaskMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => toast.success("Task added"),
    onError: (err) => toast.error(err.message),
  });

  const updateTaskMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteTaskMutation = useDeleteTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const bulkTaskMutation = useBulkTasksMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const createNoteMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: () => toast.success("Note added"),
    onError: (err) => toast.error(err.message),
  });

  const handleSaveName = (name: string) => {
    if (!name.trim() || !project) return;
    updateMutation.mutate({ id: projectId, body: { name: name.trim() } });
    setEditingField(null);
  };

  const handleSaveDescription = (description: string) => {
    if (!project) return;
    updateMutation.mutate({ id: projectId, body: { description: description || undefined } });
    setEditingField(null);
  };

  const handleCycleStatus = () => {
    if (!project) return;
    const next = STATUS_CYCLE[project.status ?? "active"] ?? "active";
    updateMutation.mutate({ id: projectId, body: { status: next } });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !workspaceId) return;
    const title = newTaskTitle.trim();
    setNewTaskTitle("");
    createTaskMutation.mutate({ title, projectId });
  };

  const handleToggleSubtask = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({
      id,
      body: {
        status: completed
          ? firstTerminalStatusId(taskStatuses)
          : defaultNonTerminalStatusId(taskStatuses),
      },
    });
  };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = (onDone?: () => void) => {
    const ids = Array.from(selectedIds);
    bulkTaskMutation.mutate(
      { action: "delete", ids },
      {
        onSuccess: ({ affected }) => {
          toast.success(`${affected} task${affected !== 1 ? "s" : ""} deleted`);
          setSelectedIds(new Set());
          setIsSelectMode(false);
          onDone?.();
        },
      },
    );
  };

  const handleDeleteTask = (id: string) => {
    deleteTaskMutation.mutate(id, {
      onSuccess: () => toast.success("Task deleted"),
    });
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !workspaceId) return;
    const title = newNoteTitle.trim();
    setNewNoteTitle("");
    createNoteMutation.mutate({ title, projectId });
  };

  const handleDelete = () => {
    if (!project) return;
    deleteMutation.mutate(projectId);
  };

  return {
    workspaceId,
    taskStatuses,
    project,
    projectLoading,
    tasks,
    tasksLoading,
    notes,
    notesLoading,
    activeTab,
    setActiveTab,
    editingField,
    setEditingField,
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
  };
}
