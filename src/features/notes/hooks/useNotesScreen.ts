"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type PendingDeleteEntry = {
  timer: ReturnType<typeof setTimeout>;
  note: Note;
  wasSelected: boolean;
};

export function useNotesScreen(): UseNotesScreenResult {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const queryClient = useQueryClient();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [shouldFetchTasks, setShouldFetchTasks] = useState(false);
  const [limit, setLimit] = useState(50);
  const pendingCreateTempIdsRef = useRef<Set<string>>(new Set());
  const createStartRef = useRef<number | null>(null);
  const noteSelectStartRef = useRef<number | null>(null);
  const pendingDeletes = useRef<Map<string, PendingDeleteEntry>>(new Map());

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: page, isLoading, error } = useNotesQuery(workspaceId, {
    search: debouncedSearch || undefined,
    tags: selectedTag ?? undefined,
    limit,
  });

  const { data: tasksPage, isLoading: tasksLoading } = useTasksQuery(
    workspaceId,
    undefined,
    {
      enabled: !!workspaceId && shouldFetchTasks,
    }
  );
  const allTasks = tasksPage?.tasks ?? [];
  const notes = page?.notes ?? [];
  const total = page?.total ?? 0;
  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort(),
    [notes]
  );

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
        current && current === variables.clientTempId ? note.id : current ?? note.id
      );
      toast.success("Note created");
    },
    onError: (err, variables) => {
      if (variables.clientTempId) {
        pendingCreateTempIdsRef.current.delete(variables.clientTempId);
        setSelectedNoteId((current) =>
          current === variables.clientTempId ? notes[0]?.id ?? null : current
        );
      }
      toast.error(err.message);
    },
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
    const tempId = `temp:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    pendingCreateTempIdsRef.current.add(tempId);
    setSelectedNoteId(tempId);
    if (typeof window !== "undefined") {
      createStartRef.current = performance.now();
    }
    createMutation.mutate({ title: "Untitled Note", tags: [], clientTempId: tempId });
  };

  const handleSelectNote = useCallback((id: string | null) => {
    if (!id) {
      setSelectedNoteId(null);
      return;
    }
    if (typeof window !== "undefined") {
      noteSelectStartRef.current = performance.now();
    }
    setSelectedNoteId(id);
  }, []);

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

  const ensureTasksLoaded = useCallback(() => {
    setShouldFetchTasks(true);
  }, []);

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
      const deletedNote = notes.find((n) => n.id === id);
      if (!deletedNote) return;

      queryClient.setQueriesData<NoteListCache>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) =>
          old && Array.isArray(old.notes)
            ? { notes: old.notes.filter((n) => n.id !== id), total: old.total - 1 }
            : old
      );

      const wasSelected = selectedNoteId === id;
      if (selectedNoteId === id) {
        setSelectedNoteId(notes.find((n) => n.id !== id)?.id ?? null);
      }

      const timer = setTimeout(() => {
        pendingDeletes.current.delete(id);
        deleteMutation.mutate(id);
      }, 5000);
      pendingDeletes.current.set(id, {
        timer,
        note: deletedNote,
        wasSelected,
      });

      toast.success("Note deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingDeletes.current.get(id);
            if (!pending) return;
            clearTimeout(pending.timer);
            pendingDeletes.current.delete(id);

            // Restore instantly for snappy UX, then revalidate in background.
            queryClient.setQueriesData<NoteListCache>(
              { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
              (old) => {
                if (!old || !Array.isArray(old.notes)) return old;
                if (old.notes.some((n) => n.id === id)) return old;
                return { ...old, notes: [pending.note, ...old.notes], total: old.total + 1 };
              }
            );

            if (pending.wasSelected) {
              setSelectedNoteId(id);
            }

            queryClient.invalidateQueries({
              queryKey: NOTES_QUERY_KEY(workspaceId ?? ""),
              refetchType: "inactive",
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
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    allTags,
    notes,
    total,
    allTasks,
    tasksLoading,
    selectedNote,
    isLoading,
    error: error as Error | null,
    createIsPending: createMutation.isPending,
    updateIsPending: updateMutation.isPending,
    handleCreateNote,
    handleUpdate,
    handleTagsChange,
    handleLinkTask,
    ensureTasksLoaded,
    handleConvertToTask,
    handleDelete,
    handleLoadMore,
  };
}
