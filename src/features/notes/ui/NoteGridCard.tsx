"use client";

import { memo, useMemo } from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import type { Note } from "@/lib/types";
import { cn } from "@/app/components/ui/utils";
import { TagChip } from "@/app/components/tags/TagChip";
import { relativeNoteDate as relativeDate } from "@/lib/date-utils";
import { getNotePreview } from "../lib/notePreview";

const MAX_VISIBLE_TAGS = 3;

interface NoteGridCardProps {
  note: Note;
  isActive?: boolean;
  onSelect: (id: string) => void;
}

function NoteGridCardComponent({ note, isActive, onSelect }: NoteGridCardProps) {
  const isSaving = note.id.startsWith("temp:");
  const { text, imageSrc, hasChecklist } = useMemo(
    () => getNotePreview(note.content),
    [note.content],
  );

  const tags = note.tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = tags.length - visibleTags.length;

  return (
    <button
      type="button"
      onClick={() => !isSaving && onSelect(note.id)}
      disabled={isSaving}
      data-testid="note-card"
      data-note-id={note.id}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        // Uniform height keeps grid rows aligned from sm up, where there are
        // 2+ columns. In the single-column phone layout it only adds dead
        // space, so let the card size to its content there.
        "group/card relative flex h-auto w-full flex-col overflow-hidden rounded-xl border p-4 text-left sm:h-56",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isSaving
          ? "cursor-default border-border/50 bg-card/50 opacity-60"
          : isActive
            ? "cursor-pointer border-primary/50 bg-card shadow-sm ring-1 ring-primary/30"
            : "cursor-pointer border-border/60 bg-card hover:-translate-y-0.5 hover:border-border hover:shadow-md",
      )}
    >
      {/* Thumbnail — gives image-only notes something to show.
          Plain <img>: note images may be base64 data URIs, which next/image
          cannot handle, and the host is arbitrary user content. */}
      {imageSrc && (
        <div className="mb-3 h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2">
        <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground">
          {note.title || "Untitled"}
        </h3>
        {isSaving && (
          <Loader2
            className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted-foreground"
            aria-label="Saving"
          />
        )}
      </div>

      {/* Body excerpt */}
      <p
        className={cn(
          "mt-1.5 flex-1 overflow-hidden text-xs leading-relaxed text-muted-foreground",
          imageSrc ? "line-clamp-2" : "line-clamp-5",
        )}
      >
        {text || (
          <span className="italic text-muted-foreground/50">Empty note</span>
        )}
      </p>

      {/* Footer: tags + timestamp */}
      <div className="mt-3 flex shrink-0 items-end justify-between gap-2">
        <div
          className="flex min-w-0 flex-wrap items-center gap-1"
          data-testid="note-card-tags"
        >
          {hasChecklist && (
            <CheckSquare
              className="size-3 shrink-0 text-muted-foreground/50"
              aria-label="Contains a checklist"
            />
          )}
          {visibleTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              size="xs"
              muted
              className="border-primary/20 bg-primary/10 text-primary/80 dark:bg-primary/15 dark:text-primary/90"
            />
          ))}
          {overflowCount > 0 && (
            <span
              className="inline-flex h-5 items-center rounded-full border border-border/50 bg-muted px-1.5 text-[10px] text-muted-foreground"
              data-testid="note-card-tag-overflow"
            >
              +{overflowCount}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
          {relativeDate(note.updatedAt)}
        </span>
      </div>
    </button>
  );
}

export const NoteGridCard = memo(NoteGridCardComponent);
