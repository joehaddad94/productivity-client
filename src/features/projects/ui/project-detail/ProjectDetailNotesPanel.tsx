"use client";

import { Plus, Search, X } from "lucide-react";
import { FileText } from "lucide-react";
import type { Note } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { NoteCard } from "@/app/components/NoteCard";
import { cn } from "@/app/components/ui/utils";

export function ProjectDetailNotesPanel({
  notes,
  notesLoading,
  notesTotal,
  notesLoadedCount,
  onLoadMore,
  noteSearch,
  setNoteSearch,
  noteTags,
  selectedNoteTags,
  toggleNoteTag,
  newNoteTitle,
  setNewNoteTitle,
  handleAddNote,
  onOpenNote,
}: {
  notes: Note[];
  notesLoading: boolean;
  notesTotal: number;
  notesLoadedCount: number;
  onLoadMore: () => void;
  noteSearch: string;
  setNoteSearch: (v: string) => void;
  noteTags: string[];
  selectedNoteTags: Set<string>;
  toggleNoteTag: (tag: string) => void;
  newNoteTitle: string;
  setNewNoteTitle: (v: string) => void;
  handleAddNote: () => void;
  onOpenNote: (noteId: string) => void;
}) {
  const hasFilters = !!noteSearch.trim() || selectedNoteTags.size > 0;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New note title and press Enter…"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground transition-colors"
        />
        <Button variant="outline" className="h-9" onClick={handleAddNote} disabled={!newNoteTitle.trim()}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {notesLoadedCount > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              type="search"
              placeholder="Search notes…"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              aria-label="Search notes"
              className="w-full h-8 pl-9 pr-9 text-xs bg-muted/30 border border-border/40 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/60 transition-colors"
            />
            {noteSearch && (
              <button
                type="button"
                onClick={() => setNoteSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {noteTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
              {noteTags.map((tag) => {
                const active = selectedNoteTags.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleNoteTag(tag)}
                    aria-pressed={active}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors",
                      active
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {notesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <FileText className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "No notes match your filters" : "No notes yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSelect={() => onOpenNote(note.id)}
              />
            ))}
          </div>
          {notesLoadedCount < notesTotal && (
            <div className="flex justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-muted-foreground">
                Load more ({notesLoadedCount} / {notesTotal})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
