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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const draggedId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

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
    if (draggedId.current && draggedId.current !== id) setDragOverId(id);
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

  const handleToggle = (id: string, completed: boolean) => {
    const terminalId = firstTerminalStatusId(taskStatuses);
    const openId = defaultNonTerminalStatusId(taskStatuses);
    updateMutation.mutate({
      id,
      body: { status: completed ? terminalId : openId },
    });
  };

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
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
        (old) =>
          old
            ? { tasks: old.tasks.filter((t) => t.id !== id), total: old.total - 1 }
            : old
      );
      if (selectedTask?.id === id) setShowDetail(false);

      const timer = setTimeout(() => {
        pendingDeletes.current.delete(id);
        deleteMutation.mutate(id);
      }, 5000);
      pendingDeletes.current.set(id, timer);

      toast.success("Task deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            const t = pendingDeletes.current.get(id);
            if (t !== undefined) clearTimeout(t);
            pendingDeletes.current.delete(id);
            queryClient.invalidateQueries({
              queryKey: TASKS_QUERY_KEY(workspaceId ?? ""),
            });
          },
        },
      });
    },
    [queryClient, workspaceId, selectedTask, deleteMutation]
  );

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

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
    expandedIds,
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
    handleLoadMore: () => setLimit((l) => l + 50),
  };
}
