import { Clock, Tag } from "lucide-react";
import type { Note } from "@/lib/types";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

interface NoteCardProps {
  note: Note;
  isActive?: boolean;
  onSelect: (note: Note) => void;
}

export function NoteCard({ note, isActive, onSelect }: NoteCardProps) {
  return (
    <div
      onClick={() => onSelect(note)}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 shadow-sm",
        isActive
          ? "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 border-l-4 border-l-primary shadow-md"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/20 dark:border-l-primary/35 hover:border-primary/15 dark:hover:border-primary/25 hover:shadow-md"
      )}
    >
      <h3 className="font-medium text-sm mb-1.5 truncate">{note.title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
        {note.preview ?? note.content?.replace(/<[^>]+>/g, "").slice(0, 120) ?? ""}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              <Tag className="size-2 mr-0.5" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
          <Clock className="size-2.5" />
          <span>{note.lastEdited ?? new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
