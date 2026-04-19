"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useNoteQuery,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/app/hooks/useNotesApi";
import { useWorkspaceTagsQuery } from "@/app/hooks/useTagsApi";
import { useNoteTagBatcher } from "@/app/hooks/useNoteTagBatcher";
import { useProjectsQuery } from "@/app/hooks/useProjectsApi";
import { useCreateTaskMutation, useTasksQuery } from "@/app/hooks/useTasksApi";
import type { NoteUpdateChanges } from "../model/types";

export function useProjectNoteEditorScreen(projectId: string, noteId: string) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [shouldFetchTasks, setShouldFetchTasks] = useState(false);
  const [linkingTaskNoteIds, setLinkingTaskNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [convertingNoteIds, setConvertingNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [linkingProjectNoteIds, setLinkingProjectNoteIds] = useState<
    Set<string>
  >(() => new Set());

  const {
    data: note,
    isLoading,
    isError,
    error,
  } = useNoteQuery(workspaceId, noteId);

  const { data: workspaceTags = [] } = useWorkspaceTagsQuery(workspaceId);

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(
    workspaceId,
    undefined,
    { enabled: !!workspaceId && shouldFetchTasks },
  );
  const allTasks = tasksPage?.tasks ?? [];

  const { data: projectsPage, isLoading: projectsLoading } = useProjectsQuery(
    workspaceId,
    { limit: 200 },
    { enabled: !!workspaceId },
  );
  const allProjects = projectsPage?.projects ?? [];

  const updateMutation = useUpdateNoteMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const tagBatcher = useNoteTagBatcher(workspaceId);

  const deleteMutation = useDeleteNoteMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const createTaskMutation = useCreateTaskMutation(workspaceId);

  const handleUpdate = useCallback(
    (id: string, changes: NoteUpdateChanges) => {
      updateMutation.mutate({ id, body: changes });
    },
    [updateMutation],
  );

  const handleAddTags = useCallback(
    (id: string, tags: string[]) => {
      if (!tags.length) return;
      tagBatcher.enqueueAdd(id, tags);
    },
    [tagBatcher],
  );

  const handleRemoveTag = useCallback(
    (id: string, tag: string) => {
      tagBatcher.enqueueRemove(id, tag);
    },
    [tagBatcher],
  );

  const ensureTasksLoaded = useCallback(() => {
    setShouldFetchTasks(true);
  }, []);

  useEffect(() => {
    if (note?.projectId) setShouldFetchTasks(true);
  }, [note?.projectId]);

  const handleLinkProject = useCallback(
    (id: string, nextProjectId: string | null) => {
      const prevProjectId = note?.projectId ?? null;
      if (prevProjectId === nextProjectId) return;

      setLinkingProjectNoteIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      updateMutation.mutate(
        { id, body: { projectId: nextProjectId } },
        {
          onSuccess: () => {
            if (nextProjectId === null) {
              toast.success("Project unlinked", {
                duration: 5000,
                action: prevProjectId
                  ? {
                      label: "Undo",
                      onClick: () =>
                        updateMutation.mutate({
                          id,
                          body: { projectId: prevProjectId },
                        }),
                    }
                  : undefined,
              });
            } else {
              toast.success("Linked to project");
            }
          },
          onError: (err) => toast.error(err.message),
          onSettled: () => {
            setLinkingProjectNoteIds((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          },
        },
      );
    },
    [note?.projectId, updateMutation],
  );

  const handleLinkTask = useCallback(
    (id: string, taskId: string | null) => {
      const prevTaskId = note?.taskId ?? null;
      if (prevTaskId === taskId) return;

      setLinkingTaskNoteIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      updateMutation.mutate(
        { id, body: { taskId } },
        {
          onSuccess: () => {
            if (taskId === null) {
              toast.success("Task unlinked", {
                duration: 5000,
                action: prevTaskId
                  ? {
                      label: "Undo",
                      onClick: () =>
                        updateMutation.mutate({
                          id,
                          body: { taskId: prevTaskId },
                        }),
                    }
                  : undefined,
              });
            } else {
              toast.success("Linked to task");
            }
          },
          onError: (err) => toast.error(err.message),
          onSettled: () => {
            setLinkingTaskNoteIds((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          },
        },
      );
    },
    [note?.taskId, updateMutation],
  );

  const handleConvertToTask = useCallback(
    (noteIdArg: string) => {
      if (!note || !workspaceId || note.id !== noteIdArg) return;
      if (convertingNoteIds.has(noteIdArg)) return;

      setConvertingNoteIds((prev) => {
        const next = new Set(prev);
        next.add(noteIdArg);
        return next;
      });
      const loadingToastId = toast.loading("Creating task…");

      createTaskMutation.mutate(
        { title: note.title },
        {
          onSuccess: (task) => {
            updateMutation.mutate(
              { id: noteIdArg, body: { taskId: task.id } },
              {
                onSettled: () => {
                  setConvertingNoteIds((prev) => {
                    if (!prev.has(noteIdArg)) return prev;
                    const next = new Set(prev);
                    next.delete(noteIdArg);
                    return next;
                  });
                },
              },
            );
            toast.success("Converted to task", {
              id: loadingToastId,
              description: `"${task.title}" added to your tasks`,
            });
          },
          onError: (err) => {
            setConvertingNoteIds((prev) => {
              if (!prev.has(noteIdArg)) return prev;
              const next = new Set(prev);
              next.delete(noteIdArg);
              return next;
            });
            toast.error(err.message, { id: loadingToastId });
          },
        },
      );
    },
    [note, workspaceId, convertingNoteIds, createTaskMutation, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (!note) return;
    deleteMutation.mutate(note.id, {
      onSuccess: () => {
        toast.success("Note deleted");
        router.replace(`/projects/${projectId}`);
      },
    });
  }, [note, deleteMutation, router, projectId]);

  const existingTagLabels = useMemo(
    () => workspaceTags.map((t) => t.tag),
    [workspaceTags],
  );

  return {
    workspaceId,
    note: note ?? null,
    isLoading,
    isError,
    error: error as Error | null,
    existingTagLabels,
    allTasks,
    tasksLoading,
    ensureTasksLoaded,
    updateIsPending: updateMutation.isPending || tagBatcher.isPending,
    linkingTaskNoteIds,
    convertingNoteIds,
    handleUpdate,
    handleAddTags,
    handleRemoveTag,
    handleLinkTask,
    handleLinkProject,
    linkingProjectNoteIds,
    allProjects,
    projectsLoading,
    handleConvertToTask,
    handleDelete,
    deleteIsPending: deleteMutation.isPending,
  };
}
