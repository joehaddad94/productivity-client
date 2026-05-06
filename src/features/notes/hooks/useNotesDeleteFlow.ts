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

  // Refs keep handleDelete stable — no recreation on every notes/selection change.
  // This prevents timer closures from going stale and fixes rapid-delete navigation.
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const selectedNoteIdRef = useRef(selectedNoteId);
  selectedNoteIdRef.current = selectedNoteId;

  const handleDelete = useCallback(
    (id: string) => {
      const currentNotes = notesRef.current;
      const currentSelectedId = selectedNoteIdRef.current;

      const deletedNote = currentNotes.find((n) => n.id === id);
      if (!deletedNote) return;

      const originalIndex = currentNotes.findIndex((n) => n.id === id);
      const wasSelected = currentSelectedId === id;

      // 1. Optimistic cache removal
      queryClient.setQueriesData<NoteListCache>(
        { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
        (old) =>
          old && Array.isArray(old.notes)
            ? { notes: old.notes.filter((n) => n.id !== id), total: old.total - 1 }
            : old,
      );

      // 2. Register pending delete BEFORE computing next selection so that rapid
      //    successive deletes correctly skip all notes that are already pending.
      const timer = setTimeout(() => {
        pendingDeletes.current.delete(id);
        deleteMutation.mutate(id);
      }, 5000);
      pendingDeletes.current.set(id, { timer, note: deletedNote, originalIndex, wasSelected });

      // 3. Navigate to next non-pending note (skips all in-flight deletes)
      if (wasSelected) {
        const pendingIds = new Set(pendingDeletes.current.keys());
        const next = currentNotes.find((n) => !pendingIds.has(n.id));
        setSelectedNoteId(next?.id ?? null);
      }

      toast.success("Note deleted", {
        id: `note-delete-${id}`,
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingDeletes.current.get(id);
            if (!pending) return;
            clearTimeout(pending.timer);
            pendingDeletes.current.delete(id);

            // Restore at original index (clamped to current list length)
            queryClient.setQueriesData<NoteListCache>(
              { queryKey: NOTES_QUERY_KEY(workspaceId ?? "") },
              (old) => {
                if (!old || !Array.isArray(old.notes)) return old;
                if (old.notes.some((n) => n.id === id)) return old;
                const idx = Math.min(pending.originalIndex, old.notes.length);
                return {
                  ...old,
                  notes: [
                    ...old.notes.slice(0, idx),
                    pending.note,
                    ...old.notes.slice(idx),
                  ],
                  total: old.total + 1,
                };
              },
            );

            if (pending.wasSelected) setSelectedNoteId(id);

            queryClient.invalidateQueries({
              queryKey: NOTES_QUERY_KEY(workspaceId ?? ""),
              refetchType: "inactive",
            });
          },
        },
      });
    },
    // notes and selectedNoteId intentionally omitted — accessed via refs above
    // so this callback is stable across renders and timer closures stay valid
    [queryClient, workspaceId, deleteMutation, setSelectedNoteId],
  );

  return { handleDelete };
}
