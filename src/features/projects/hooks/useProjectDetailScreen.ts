"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  PROJECT_QUERY_KEY,
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
  useAssignTaskMutation,
  useUnassignTaskMutation,
} from "@/app/hooks/useTasksApi";
import { useMembersQuery } from "@/app/hooks/useMembersApi";
import type { AssigneeOption } from "@/features/tasks/ui/AssigneePicker";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import type { Project, TaskStatusDefinition } from "@/lib/types";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
  isTaskStatusTerminal,
} from "@/features/tasks/lib/taskStatusHelpers";

const HIDE_COMPLETED_KEY = "project_detail_hide_completed";
const TASKS_PAGE_SIZE = 50;
const NOTES_PAGE_SIZE = 50;

export function useProjectDetailScreen(
  projectId: string,
  { initialTab = "tasks" }: { initialTab?: "tasks" | "notes" } = {},
) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const { data: rawMembers = [] } = useMembersQuery(workspaceId);
  const workspaceMembers: AssigneeOption[] = rawMembers.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
  }));

  const adjustProjectCount = useCallback((field: "tasks" | "notes", delta: number) => {
    if (!workspaceId) return;
    queryClient.setQueryData<Project>(
      PROJECT_QUERY_KEY(workspaceId, projectId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          _count: {
            tasks: old._count?.tasks ?? 0,
            notes: old._count?.notes ?? 0,
            [field]: (old._count?.[field] ?? 0) + delta,
          },
        };
      },
    );
  }, [queryClient, workspaceId, projectId]);

  const { data: rawTaskStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawTaskStatuses),
    [workspaceId, rawTaskStatuses],
  );

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">(initialTab);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View preferences (persisted)
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(HIDE_COMPLETED_KEY) === "1";
  });

  // Pagination
  const [tasksLimit, setTasksLimit] = useState(TASKS_PAGE_SIZE);
  const [notesLimit, setNotesLimit] = useState(NOTES_PAGE_SIZE);

  // Task status filter
  const [selectedStatusIds, setSelectedStatusIds] = useState<Set<string>>(new Set());

  // Notes filters
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNoteTags, setSelectedNoteTags] = useState<Set<string>>(new Set());

  // Sync activeTab with URL changes (browser back/forward)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem(HIDE_COMPLETED_KEY, hideCompleted ? "1" : "0");
  }, [hideCompleted]);

  const isValidProjectId = !projectId.startsWith("temp_");

  const { data: project, isLoading: projectLoading, isError: projectError } = useProjectQuery(workspaceId, projectId, {
    enabled: isValidProjectId,
  });

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(
    workspaceId,
    { projectId, limit: tasksLimit },
    { enabled: !!workspaceId && isValidProjectId && activeTab === "tasks" },
  );
  const tasks = tasksPage?.tasks ?? [];
  const tasksTotal = tasksPage?.total ?? 0;

  const { data: notesPage, isLoading: notesLoading } = useNotesQuery(
    workspaceId,
    { projectId, limit: notesLimit },
    { enabled: !!workspaceId && isValidProjectId && activeTab === "notes" },
  );
  const notes = notesPage?.notes ?? [];
  const notesTotal = notesPage?.total ?? 0;

  // Tasks: filter (hide completed + status)
  const visibleTasks = useMemo(() => {
    let result = tasks;
    if (hideCompleted) {
      result = result.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
    }
    if (selectedStatusIds.size > 0) {
      result = result.filter((t) => selectedStatusIds.has(t.status ?? ""));
    }
    return result;
  }, [tasks, hideCompleted, selectedStatusIds, taskStatuses]);

  const toggleStatusFilter = useCallback((statusId: string) => {
    setSelectedStatusIds((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  }, []);

  // Notes: all tags + filter (search + tags)
  const noteTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags ?? []) set.add(t);
    return Array.from(set).sort();
  }, [notes]);

  const visibleNotes = useMemo(() => {
    let result = notes;
    const q = noteSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((n) => {
        const inTitle = n.title.toLowerCase().includes(q);
        const inContent = (n.content ?? "").toLowerCase().includes(q);
        return inTitle || inContent;
      });
    }
    if (selectedNoteTags.size > 0) {
      result = result.filter((n) =>
        (n.tags ?? []).some((t) => selectedNoteTags.has(t)),
      );
    }
    return result;
  }, [notes, noteSearch, selectedNoteTags]);

  const handleLoadMoreTasks = () => setTasksLimit((l) => l + TASKS_PAGE_SIZE);
  const handleLoadMoreNotes = () => setNotesLimit((l) => l + NOTES_PAGE_SIZE);

  const toggleNoteTag = useCallback((tag: string) => {
    setSelectedNoteTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

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
    onSuccess: () => { toast.success("Task added"); adjustProjectCount("tasks", 1); },
    onError: (err) => toast.error(err.message),
  });

  const updateTaskMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteTaskMutation = useDeleteTaskMutation(workspaceId, {
    onSuccess: () => adjustProjectCount("tasks", -1),
    onError: (err) => toast.error(err.message),
  });

  const bulkTaskMutation = useBulkTasksMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const assignTaskMutation = useAssignTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const unassignTaskMutation = useUnassignTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const handleAssigneesChange = useCallback(
    (taskId: string, nextIds: string[]) => {
      const task = tasks.find((t) => t.id === taskId);
      const currentIds = (task?.assignees ?? []).map((a) => a.userId);
      const toAdd = nextIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !nextIds.includes(id));
      if (toAdd.length > 0) {
        assignTaskMutation.mutate({ taskId, userIds: toAdd });
      }
      for (const userId of toRemove) {
        unassignTaskMutation.mutate({ taskId, userId });
      }
    },
    [tasks, assignTaskMutation, unassignTaskMutation],
  );

  const createNoteMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: () => { toast.success("Note added"); adjustProjectCount("notes", 1); },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveName = (name: string) => {
    if (!name.trim() || !project) return;
    updateMutation.mutate({ id: projectId, body: { name: name.trim() } });
  };

  const handleSaveDescription = (description: string) => {
    if (!project) return;
    updateMutation.mutate({ id: projectId, body: { description: description || undefined } });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !workspaceId) return;
    const title = newTaskTitle.trim();
    setNewTaskTitle("");
    // Self-assign so the task lands in the creator's rollup (§6.2).
    createTaskMutation.mutate(
      { title, projectId, ...(user ? { assigneeIds: [user.id] } : {}) },
      { onError: () => setNewTaskTitle(title) },
    );
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
          adjustProjectCount("tasks", -affected);
          setSelectedIds(new Set());
          setIsSelectMode(false);
          onDone?.();
        },
      },
    );
  };

  const handleDeleteTask = (id: string) => {
    deleteTaskMutation.mutate(id, {
      onSuccess: () => { toast.success("Task deleted"); },
    });
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !workspaceId) return;
    const title = newNoteTitle.trim();
    setNewNoteTitle("");
    createNoteMutation.mutate(
      { title, projectId },
      { onError: () => setNewNoteTitle(title) },
    );
  };

  const handleDelete = () => {
    if (!project) return;
    deleteMutation.mutate(projectId);
  };

  return {
    workspaceId,
    workspaceMembers,
    taskStatuses,
    project,
    projectLoading,
    projectError,
    tasks: visibleTasks,
    tasksLoading,
    tasksTotal,
    tasksLoadedCount: tasks.length,
    handleLoadMoreTasks,
    hideCompleted,
    setHideCompleted,
    selectedStatusIds,
    toggleStatusFilter,
    notes: visibleNotes,
    notesLoading,
    notesTotal,
    notesLoadedCount: notes.length,
    handleLoadMoreNotes,
    noteSearch,
    setNoteSearch,
    noteTags,
    selectedNoteTags,
    toggleNoteTag,
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
    handleAssigneesChange,
    handleDelete,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
  };
}
