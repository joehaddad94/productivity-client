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
import { useCreateTaskMutation, useTasksQuery } from "@/app/hooks/useTasksApi";
import { useDebounce } from "@/app/hooks/useDebounce";
import type { Note } from "@/lib/types";
import type { NoteUpdateChanges, UseNotesScreenResult } from "../model/types";

type NoteListCache = { notes: Note[]; total: number };

export function useNotesScreen(): UseNotesScreenResult {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: allNotesPage } = useNotesQuery(workspaceId, { limit: 200 });
  const allTags = Array.from(
    new Set((allNotesPage?.notes ?? []).flatMap((n) => n.tags ?? []))
  ).sort();

  const { data: page, isLoading, error } = useNotesQuery(workspaceId, {
    search: debouncedSearch || undefined,
    tags: selectedTag ?? undefined,
    limit,
  });

  const { data: tasksPage } = useTasksQuery(workspaceId);
  const allTasks = tasksPage?.tasks ?? [];
  const notes = page?.notes ?? [];
  const total = page?.total ?? 0;

  const createMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: (note) => {
      setSelectedNoteId(note.id);
      toast.success("Note created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateNoteMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteNoteMutation(workspaceId, {
    onError: (err) => {
      toast.error(err.message);
      queryClient.invalidateQueries({
        queryKey: NOTES_QUERY_KEY(workspaceId ?? ""),
      });
    },
  });

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const handleCreateNote = () => {
    if (!workspaceId) return;
    createMutation.mutate({ title: "Untitled Note", tags: [] });
  };

  const handleUpdate = useCallback(
    (id: string, changes: NoteUpdateChanges) => {
      updateMutation.mutate({ id, body: changes });
    },
    [updateMutation]
  );

  const handleTagsChange = useCallback(
    (id: string, tags: string[]) => {
      updateMutation.mutate({ id, body: { tags } });
    },
    [updateMutation]
  );

  const handleLinkTask = useCallback(
    (id: string, taskId: string | null) => {
      updateMutation.mutate({ id, body: { taskId: taskId ?? undefined } });
    },
    [updateMutation]
  );

  const createTaskMutation = useCreateTaskMutation(workspaceId);

  const handleConvertToTask = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !workspaceId) return;
      createTaskMutation.mutate(
        { title: note.title },
        {
          onSuccess: (task) => {
            updateMutation.mutate({ id: noteId, body: { taskId: task.id } });
            toast.success("Converted to task", {
              description: `"${task.title}" added to your tasks`,
            });
          },
          onError: (err) => toast.error(err.message),
        }
      );
    },
    [notes, workspaceId, createTaskMutation, updateMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      queryClient.setQueriesData<NoteListCache>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) =>
          old && Array.isArray(old.notes)
            ? { notes: old.notes.filter((n) => n.id !== id), total: old.total - 1 }
            : old
      );

      if (selectedNoteId === id) {
        setSelectedNoteId(notes.find((n) => n.id !== id)?.id ?? null);
      }

      const timer = setTimeout(() => {
        pendingDeletes.current.delete(id);
        deleteMutation.mutate(id);
      }, 5000);
      pendingDeletes.current.set(id, timer);

      toast.success("Note deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            const t = pendingDeletes.current.get(id);
            if (t !== undefined) clearTimeout(t);
            pendingDeletes.current.delete(id);
            queryClient.invalidateQueries({
              queryKey: NOTES_QUERY_KEY(workspaceId ?? ""),
            });
          },
        },
      });
    },
    [queryClient, workspaceId, selectedNoteId, notes, deleteMutation]
  );

  const handleLoadMore = useCallback(() => {
    setLimit((value) => value + 50);
  }, []);

  return {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    notes,
    total,
    allTasks,
    selectedNote,
    isLoading,
    error: error as Error | null,
    createIsPending: createMutation.isPending,
    updateIsPending: updateMutation.isPending,
    handleCreateNote,
    handleUpdate,
    handleTagsChange,
    handleLinkTask,
    handleConvertToTask,
    handleDelete,
    handleLoadMore,
  };
}
