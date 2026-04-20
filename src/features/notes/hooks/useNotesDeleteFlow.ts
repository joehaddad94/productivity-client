"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { NOTES_QUERY_KEY } from "@/app/hooks/useNotesApi";
import type { Note } from "@/lib/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { NoteListCache, PendingDeleteEntry } from "./notesScreenCacheTypes";

export function useNotesDeleteFlow({
  workspaceId,
  notes,
  selectedNoteId,
  setSelectedNoteId,
  deleteMutation,
}: {
  workspaceId: string | null;
  notes: Note[];
  selectedNoteId: string | null;
  setSelectedNoteId: Dispatch<SetStateAction<string | null>>;
  deleteMutation: UseMutationResult<void, Error, string, unknown>;
}) {
  const queryClient = useQueryClient();
  const pendingDeletes = useRef<Map<string, PendingDeleteEntry>>(new Map());

  const handleDelete = useCallback(
    (id: string) => {
      const deletedNote = notes.find((n) => n.id === id);
      if (!deletedNote) return;

      queryClient.setQueriesData<NoteListCache>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) =>
          old && Array.isArray(old.notes)
            ? { notes: old.notes.filter((n) => n.id !== id), total: old.total - 1 }
            : old,
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

            queryClient.setQueriesData<NoteListCache>(
              { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
              (old) => {
                if (!old || !Array.isArray(old.notes)) return old;
                if (old.notes.some((n) => n.id === id)) return old;
                return { ...old, notes: [pending.note, ...old.notes], total: old.total + 1 };
              },
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
    [queryClient, workspaceId, selectedNoteId, notes, deleteMutation, setSelectedNoteId],
  );

  return { handleDelete };
}
