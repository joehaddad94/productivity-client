import type { Note } from "@/lib/types";

export type NotesDateGroup = { label: string; notes: Note[] };

/**
 * Buckets notes by `updatedAt` into Today / Yesterday / This week / This month / Older.
 * Empty buckets are omitted.
 */
export function groupNotesByDate(notes: Note[]): NotesDateGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets: NotesDateGroup[] = [
    { label: "Today", notes: [] },
    { label: "Yesterday", notes: [] },
    { label: "This week", notes: [] },
    { label: "This month", notes: [] },
    { label: "Older", notes: [] },
  ];

  for (const note of notes) {
    const d = new Date(note.updatedAt);
    if (d >= todayStart) buckets[0].notes.push(note);
    else if (d >= yesterdayStart) buckets[1].notes.push(note);
    else if (d >= weekStart) buckets[2].notes.push(note);
    else if (d >= monthStart) buckets[3].notes.push(note);
    else buckets[4].notes.push(note);
  }

  return buckets.filter((b) => b.notes.length > 0);
}
