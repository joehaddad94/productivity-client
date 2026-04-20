"use client";

import { Plus } from "lucide-react";
import { FileText } from "lucide-react";
import type { Note } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { NoteCard } from "@/app/components/NoteCard";

export function ProjectDetailNotesPanel({
  notes,
  notesLoading,
  newNoteTitle,
  setNewNoteTitle,
  handleAddNote,
  onOpenNote,
}: {
  notes: Note[];
  notesLoading: boolean;
  newNoteTitle: string;
  setNewNoteTitle: (v: string) => void;
  handleAddNote: () => void;
  onOpenNote: (noteId: string) => void;
}) {
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

      {notesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <FileText className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelect={() => onOpenNote(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
