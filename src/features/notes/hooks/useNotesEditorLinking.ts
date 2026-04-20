"use client";

import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Note } from "@/lib/types";
import type { UpdateNoteBody } from "@/lib/api/notes-api";

export function useNotesEditorLinking(
  notes: Note[],
  updateMutation: UseMutationResult<
    Note,
    Error,
    { id: string; body: UpdateNoteBody },
    unknown
  >,
) {
  const [linkingTaskNoteIds, setLinkingTaskNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [linkingProjectNoteIds, setLinkingProjectNoteIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleLinkTask = useCallback(
    (id: string, taskId: string | null) => {
      const prevTaskId = notes.find((n) => n.id === id)?.taskId ?? null;
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
          onError: (err) => {
            toast.error(err.message);
          },
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
    [notes, updateMutation],
  );

  const handleLinkProject = useCallback(
    (id: string, projectId: string | null) => {
      const prevProjectId = notes.find((n) => n.id === id)?.projectId ?? null;
      if (prevProjectId === projectId) return;

      setLinkingProjectNoteIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      updateMutation.mutate(
        { id, body: { projectId } },
        {
          onSuccess: () => {
            if (projectId === null) {
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
    [notes, updateMutation],
  );

  return {
    linkingTaskNoteIds,
    linkingProjectNoteIds,
    handleLinkTask,
    handleLinkProject,
  };
}
