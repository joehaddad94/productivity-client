"use client";

import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Note, Task } from "@/lib/types";
import type { CreateTaskBody } from "@/lib/api/tasks-api";
import type { UpdateNoteBody } from "@/lib/api/notes-api";

export function useNotesConvertToTask(
  notes: Note[],
  workspaceId: string | null,
  createTaskMutation: UseMutationResult<Task, Error, CreateTaskBody, unknown>,
  updateMutation: UseMutationResult<
    Note,
    Error,
    { id: string; body: UpdateNoteBody },
    unknown
  >,
) {
  const [convertingNoteIds, setConvertingNoteIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleConvertToTask = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !workspaceId) return;
      if (convertingNoteIds.has(noteId)) return;

      setConvertingNoteIds((prev) => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });
      const loadingToastId = toast.loading("Creating task…");

      createTaskMutation.mutate(
        { title: note.title },
        {
          onSuccess: (task) => {
            updateMutation.mutate(
              { id: noteId, body: { taskId: task.id } },
              {
                onSettled: () => {
                  setConvertingNoteIds((prev) => {
                    if (!prev.has(noteId)) return prev;
                    const next = new Set(prev);
                    next.delete(noteId);
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
              if (!prev.has(noteId)) return prev;
              const next = new Set(prev);
              next.delete(noteId);
              return next;
            });
            toast.error(err.message, { id: loadingToastId });
          },
        },
      );
    },
    [notes, workspaceId, convertingNoteIds, createTaskMutation, updateMutation],
  );

  return { convertingNoteIds, handleConvertToTask };
}
