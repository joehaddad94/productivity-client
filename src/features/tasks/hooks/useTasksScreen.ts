"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  TASKS_QUERY_KEY,
  useBulkTasksMutation,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
  useTasksQuery,
  useUpdateTaskMutation,
} from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { useProjectsQuery } from "@/app/hooks/useProjectsApi";
import { useDebounce } from "@/app/hooks/useDebounce";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import type { PriorityFilter, TaskFormData } from "../model/types";
import {
  activeTaskStatuses,
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  firstTerminalStatusId,
} from "../lib/taskStatusHelpers";

export function useTasksScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterProjectId, setFilterProjectId] = useState<"all" | string>("all");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [limit, setLimit] = useState(200);
  // IDs in this set are COLLAPSED (subtasks hidden). Empty = all expanded.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const draggedId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragOverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pendingToggles = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: page, isLoading, error } = useTasksQuery(workspaceId, {
    search: debouncedSearch || undefined,
    priority: filterPriority === "all" ? undefined : filterPriority,
    projectId: filterProjectId === "all" ? undefined : filterProjectId,
    limit,
  });
  const { data: projectsPage, isLoading: projectsLoading } = useProjectsQuery(workspaceId, {
    limit: 200,
  });
  const projectsForPicker =
    projectsPage?.projects.map((p) => ({ id: p.id, name: p.name })) ?? [];

  const { data: rawTaskStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawTaskStatuses),
    [workspaceId, rawTaskStatuses],
  );

  const statusColumns = useMemo(
    () =>
      activeTaskStatuses(taskStatuses).map((s) => ({
        status: s,
        tasks: (page?.tasks ?? []).filter((t) => t.status === s.id),
      })),
    [page?.tasks, taskStatuses],
  );

  const tasks = page?.tasks ?? [];
  const total = page?.total ?? 0;

  const createMutation = useCreateTaskMutation(workspaceId, {
    onSuccess: () => {
      setShowCreate(false);
      toast.success("Task created");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = useUpdateTaskMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = useDeleteTaskMutation(workspaceId, {
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
    },
  });
  const bulkMutation = useBulkTasksMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });
  const reorderMutation = useReorderTasksMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const handleDragStart = useCallback((id: string) => {
    draggedId.current = id;
  }, []);

  const handleDragOver = useCallback((id: string) => {
    if (!draggedId.current || draggedId.current === id) return;
    if (dragOverTimer.current) clearTimeout(dragOverTimer.current);
    dragOverTimer.current = setTimeout(() => setDragOverId(id), 40);
  }, []);

  const handleDrop = useCallback(
    (dropTargetId: string) => {
      const srcId = draggedId.current;
      draggedId.current = null;
      setDragOverId(null);
      if (!srcId || srcId === dropTargetId) return;

      const allTopLevel = tasks.filter((t) => !t.parentTaskId);
      const srcIdx = allTopLevel.findIndex((t) => t.id === srcId);
      const dstIdx = allTopLevel.findIndex((t) => t.id === dropTargetId);
      if (srcIdx === -1 || dstIdx === -1) return;

      const reordered = [...allTopLevel];
      const [moved] = reordered.splice(srcIdx, 1);
      reordered.splice(dstIdx, 0, moved);

      queryClient.setQueriesData<{ tasks: Task[]; total: number }>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => (old ? { ...old, tasks: reordered } : old)
      );

      reorderMutation.mutate(reordered.map((t) => t.id));
    },
    [tasks, queryClient, workspaceId, reorderMutation]
  );

  const handleBulkComplete = () => {
    const ids = Array.from(selectedIds);
    bulkMutation.mutate(
      { action: "complete", ids },
      {
        onSuccess: ({ affected }) => {
          toast.success(`${affected} task${affected !== 1 ? "s" : ""} completed`);
          setSelectedIds(new Set());
          setIsSelectMode(false);
        },
      }
    );
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkMutation.mutate(
      { action: "delete", ids },
      {
        onSuccess: ({ affected }) => {
          toast.success(`${affected} task${affected !== 1 ? "s" : ""} deleted`);
          setSelectedIds(new Set());
          setIsSelectMode(false);
          if (selectedTask && ids.includes(selectedTask.id)) setShowDetail(false);
        },
      }
    );
  };

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggle = useCallback((id: string, completed: boolean) => {
    const terminalId = firstTerminalStatusId(taskStatuses);
    const openId = defaultNonTerminalStatusId(taskStatuses);
    const nextStatus = completed ? terminalId : openId;

    // Optimistic update — works for both top-level tasks and nested subtasks
    queryClient.setQueriesData<{ tasks: Task[]; total: number }>(
      { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
      (old) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => {
            if (t.id === id) return { ...t, status: nextStatus };
            if (t.subtasks?.some((s) => s.id === id))
              return { ...t, subtasks: t.subtasks!.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)) };
            return t;
          }),
        };
      },
    );

    // Debounce the API call — rapid toggles cancel the previous timer
    const existing = pendingToggles.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      pendingToggles.current.delete(id);
      updateMutation.mutate(
        { id, body: { status: nextStatus } },
        {
          onError: () => {
            // Revert by re-fetching the source of truth
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY(workspaceId ?? "") });
          },
        },
      );
    }, 400);
    pendingToggles.current.set(id, timer);
  }, [taskStatuses, updateMutation, queryClient, workspaceId]);

  const handleToggleExpand = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      queryClient.setQueriesData<{ tasks: Task[]; total: number }>(
        { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
        (old) => {
          if (!old || !Array.isArray(old.tasks)) return old;
          return { tasks: old.tasks.filter((t) => t.id !== id && t.parentTaskId !== id), total: old.total - 1 };
        }
      );
      if (selectedTask?.id === id) setShowDetail(false);
      deleteMutation.mutate(id);
      toast.success("Task deleted");
    },
    [queryClient, workspaceId, selectedTask, deleteMutation]
  );

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleTitleSave = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    queryClient.setQueriesData<{ tasks: Task[]; total: number }>(
      { queryKey: TASKS_QUERY_KEY(workspaceId ?? "") },
      (old) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => {
            if (t.id === id) return { ...t, title: trimmed };
            if (t.subtasks?.some((s) => s.id === id))
              return { ...t, subtasks: t.subtasks!.map((s) => (s.id === id ? { ...s, title: trimmed } : s)) };
            return t;
          }),
        };
      },
    );
    updateMutation.mutate({ id, body: { title: trimmed } });
  }, [queryClient, workspaceId, updateMutation]);

  const handleCreate = (data: TaskFormData) => {
    createMutation.mutate(data);
  };

  const isFiltered =
    debouncedSearch.length > 0 || filterPriority !== "all" || filterProjectId !== "all";

  return {
    workspaceId,
    searchQuery,
    setSearchQuery,
    filterProjectId,
    setFilterProjectId,
    filterPriority,
    setFilterPriority,
    projectsForPicker,
    projectsLoading,
    showCreate,
    setShowCreate,
    selectedTask,
    showDetail,
    setShowDetail,
    tasks,
    total,
    taskStatuses,
    statusColumns,
    isLoading,
    error,
    isFiltered,
    collapsedIds,
    setCollapsedIds,
    isSelectMode,
    setIsSelectMode,
    selectedIds,
    setSelectedIds,
    dragOverId,
    createMutation,
    updateMutation,
    deleteMutation,
    bulkMutation,
    handleCreate,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleBulkComplete,
    handleBulkDelete,
    handleToggleSelect,
    handleToggle,
    handleToggleExpand,
    handleDelete,
    handleSelectTask,
    handleTitleSave,
    handleLoadMore: () => setLimit((l) => l + 50),
  };
}
