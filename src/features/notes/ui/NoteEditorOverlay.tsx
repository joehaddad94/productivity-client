"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { cn } from "@/app/components/ui/utils";
import type { Note } from "@/lib/types";

interface NoteEditorOverlayProps {
  note: Note | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

/**
 * Focused editor surface for the gallery layout: the grid stays mounted
 * underneath (so scroll position and query state survive), and the note opens
 * in a modal panel over it. Escape or the backdrop closes it.
 */
export function NoteEditorOverlay({
  note,
  onClose,
  onDelete,
  children,
}: NoteEditorOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const open = note !== null;

  // Escape closes. Registered on the document so it works regardless of where
  // focus sits inside the editor (TipTap swallows some bubbling).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock background scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 lg:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={note.title || "Untitled note"}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close note"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm animate-in fade-in duration-150"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl",
          "sm:h-[88vh] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-border/60",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
      >
        {/* Panel chrome — close + delete live here so the editor body stays clean */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X className="size-3.5" />
            Close
          </button>

          <span className="truncate px-2 text-[11px] text-muted-foreground/60">
            Esc to close
          </span>

          <button
            type="button"
            onClick={() => onDelete(note.id)}
            aria-label="Delete this note"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>

        {/* Editor */}
        <div className="flex min-h-0 flex-1 flex-col">
          {children ?? <ScreenLoader variant="app" />}
        </div>
      </div>
    </div>
  );
}
