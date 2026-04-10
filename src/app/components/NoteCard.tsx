import type { Note } from "@/lib/types";
import { cn } from "./ui/utils";

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
  onSelect: (note: Note) => void;
}

function relativeDate(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NoteCard({ note, isActive, onSelect }: NoteCardProps) {
  const preview = note.content?.replace(/<[^>]+>/g, "").trim().slice(0, 80) ?? "";

  return (
    <div
      onClick={() => onSelect(note)}
      className={cn(
        "px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "bg-muted"
          : "hover:bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium truncate leading-snug">{note.title || "Untitled"}</p>
        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{relativeDate(note.updatedAt)}</span>
      </div>
      {preview && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{preview}</p>
      )}
      {note.tags && note.tags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
