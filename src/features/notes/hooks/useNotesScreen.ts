"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  NOTES_QUERY_KEY,
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useUpdateNoteMutation,
} from "@/app/hooks/useNotesApi";
import { useWorkspaceTagsQuery } from "@/app/hooks/useTagsApi";
import { useNoteTagBatcher } from "@/app/hooks/useNoteTagBatcher";
import { useProjectsQuery } from "@/app/hooks/useProjectsApi";
import { useCreateTaskMutation, useTasksQuery } from "@/app/hooks/useTasksApi";
import type { NoteUpdateChanges, UseNotesScreenResult } from "../model/types";
import { useNotesConvertToTask } from "./useNotesConvertToTask";
import { useNotesDeleteFlow } from "./useNotesDeleteFlow";
import { useNotesEditorLinking } from "./useNotesEditorLinking";
import { useNotesListFilters } from "./useNotesListFilters";
import { useNotesScreenSelection } from "./useNotesScreenSelection";

export function useNotesScreen(): UseNotesScreenResult {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const { data: projectsPage, isLoading: projectsLoading } = useProjectsQuery(
    workspaceId,
    { limit: 200 },
    { enabled: !!workspaceId },
  );
  const allProjects = projectsPage?.projects ?? [];

  const filters = useNotesListFilters(allProjects, projectsLoading);

  const { data: page, isLoading, error } = useNotesQuery(workspaceId, {
    search: filters.debouncedSearch || undefined,
    tags: filters.selectedTags.length ? filters.selectedTags : undefined,
    tagMode: filters.selectedTags.length >= 2 ? filters.tagMode : undefined,
    projectId: filters.filterProjectId ?? undefined,
    limit: filters.limit,
  });

  const { data: workspaceTags = [] } = useWorkspaceTagsQuery(workspaceId);

  const [shouldFetchTasks, setShouldFetchTasks] = useState(false);
  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(
    workspaceId,
    undefined,
    {
      enabled: !!workspaceId && shouldFetchTasks,
    },
  );
  const allTasks = tasksPage?.tasks ?? [];

  const notes = page?.notes ?? [];
  const total = page?.total ?? 0;

  const {
    selectedNoteId,
    setSelectedNoteId,
    handleSelectNote,
    selectedNote,
    noteSelectStartRef,
  } = useNotesScreenSelection(notes);

  const pendingCreateTempIdsRef = useRef<Set<string>>(new Set());
  const createStartRef = useRef<number | null>(null);

  const createMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: (note, variables) => {
      if (createStartRef.current !== null && typeof window !== "undefined") {
        const e2eMs = Math.round((performance.now() - createStartRef.current) * 10) / 10;
        console.log("[notes-timing] e2e:create-note-until-mutation-success:", e2eMs, "ms", {
          noteId: note.id,
          workspaceId,
        });
      }
      if (variables.clientTempId) {
        pendingCreateTempIdsRef.current.delete(variables.clientTempId);
      }
      setSelectedNoteId((current) =>
        current && current === variables.clientTempId ? note.id : current ?? note.id,
      );
      toast.success("Note created");
    },
    onError: (err, variables) => {
      if (variables.clientTempId) {
        pendingCreateTempIdsRef.current.delete(variables.clientTempId);
        setSelectedNoteId((current) =>
          current === variables.clientTempId ? notes[0]?.id ?? null : current,
        );
      }
      toast.error(err.message);
    },
  });

  const updateMutation = useUpdateNoteMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const tagBatcher = useNoteTagBatcher(workspaceId);

  const deleteMutation = useDeleteNoteMutation(workspaceId, {
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(workspaceId ?? ""),
      });
    },
  });

  const { handleDelete } = useNotesDeleteFlow({
    workspaceId,
    notes,
    selectedNoteId,
    setSelectedNoteId,
    deleteMutation,
  });

  const {
    linkingTaskNoteIds,
    linkingProjectNoteIds,
    handleLinkTask,
    handleLinkProject,
  } = useNotesEditorLinking(notes, updateMutation);

  const createTaskMutation = useCreateTaskMutation(workspaceId);
  const { convertingNoteIds, handleConvertToTask } = useNotesConvertToTask(
    notes,
    workspaceId,
    createTaskMutation,
    updateMutation,
  );

  const handleCreateNote = () => {
    if (!workspaceId) return;
    const tempId = `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    pendingCreateTempIdsRef.current.add(tempId);
    setSelectedNoteId(tempId);
    if (typeof window !== "undefined") {
      createStartRef.current = performance.now();
    }
    createMutation.mutate({
      title: "Untitled Note",
      tags: [],
      clientTempId: tempId,
      ...(filters.filterProjectId ? { projectId: filters.filterProjectId } : {}),
    });
  };

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

  const ensureProjectsLoaded = useCallback(() => {}, []);

  useEffect(() => {
    if (createStartRef.current === null || createMutation.isPending || isLoading) return;
    if (typeof window === "undefined") return;
    const uiMs = Math.round((performance.now() - createStartRef.current) * 10) / 10;
    console.log("[notes-timing] ui:create-note-until-list-settled:", uiMs, "ms", {
      notesInView: notes.length,
      total,
      workspaceId,
    });
    createStartRef.current = null;
  }, [createMutation.isPending, isLoading, notes.length, total, workspaceId]);

  useEffect(() => {
    if (!selectedNote || noteSelectStartRef.current === null) return;
    if (typeof window === "undefined") return;
    const switchMs = Math.round((performance.now() - noteSelectStartRef.current) * 10) / 10;
    console.log("[notes-timing] switch-note-e2e:", switchMs, "ms", {
      selectedNoteId: selectedNote.id,
      workspaceId,
    });
    noteSelectStartRef.current = null;
  }, [selectedNote, workspaceId]);

  return {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId: handleSelectNote,
    searchQuery: filters.searchQuery,
    setSearchQuery: filters.setSearchQuery,
    selectedTags: filters.selectedTags,
    setSelectedTags: filters.setSelectedTags,
    toggleTag: filters.toggleTag,
    tagMode: filters.tagMode,
    setTagMode: filters.setTagMode,
    filterProjectId: filters.filterProjectId,
    setFilterProjectId: filters.setFilterProjectId,
    allTags: workspaceTags,
    notes,
    total,
    allTasks,
    tasksLoading,
    selectedNote,
    isLoading,
    error: error as Error | null,
    createIsPending: createMutation.isPending,
    updateIsPending: updateMutation.isPending || tagBatcher.isPending,
    handleCreateNote,
    handleUpdate,
    handleAddTags,
    handleRemoveTag,
    handleLinkTask,
    linkingTaskNoteIds,
    ensureTasksLoaded,
    allProjects,
    projectsLoading,
    handleLinkProject,
    linkingProjectNoteIds,
    ensureProjectsLoaded,
    handleConvertToTask,
    convertingNoteIds,
    handleDelete,
    handleLoadMore: filters.handleLoadMore,
  };
}
