"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "@/lib/types";

/**
 * Selected note id synced with the current note list (first note when list changes, etc.).
 */
export function useNotesScreenSelection(notes: Note[]) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const noteSelectStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (notes.length === 0) {
      setSelectedNoteId(null);
      return;
    }
    setSelectedNoteId((current) => {
      if (current && notes.some((n) => n.id === current)) return current;
      return notes[0].id;
    });
  }, [notes]);

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

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  return {
    selectedNoteId,
    setSelectedNoteId,
    handleSelectNote,
    selectedNote,
    noteSelectStartRef,
  };
}
