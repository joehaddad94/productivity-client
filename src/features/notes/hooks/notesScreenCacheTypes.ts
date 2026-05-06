import type { Note } from "@/lib/types";

export type NoteListCache = { notes: Note[]; total: number };

export type PendingDeleteEntry = {
  timer: ReturnType<typeof setTimeout>;
  note: Note;
  originalIndex: number;
  wasSelected: boolean;
};
