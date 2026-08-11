"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import type { Note } from "@/lib/types";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const open = note !== null;

  // Move focus into the dialog on open and hand it back on close. Without
  // this, focus stayed on the card behind the panel.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Escape closes; Tab is trapped inside the panel.
  //
  // Registered in the BUBBLE phase, and skipped once something nearer the
  // event has already handled the key. Capture phase broke two things: it beat
  // ProseMirror's Tab keymap, so Tab could no longer indent a list item inside
  // the editor, and it beat Radix's Escape handling, so dismissing the link
  // popover tore down the whole note editor with it.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        // A popover/menu layered above the panel owns Escape first.
        if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      const active = document.activeElement as HTMLElement | null;

      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (!active || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
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
      {/* Backdrop. Click-to-dismiss for mice; hidden from assistive tech since
          Escape and the Close button already cover it, and a full-screen
          "Close note" button is just noise in the a11y tree. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm animate-in fade-in duration-150"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "outline-none",
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
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
