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
        "p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm",
        isActive
          ? "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 border-l-4 border-l-primary shadow-md"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/20 dark:border-l-primary/35 hover:border-primary/15 dark:hover:border-primary/25 hover:shadow-md"
      )}
    >
      <h3 className="font-medium mb-2 truncate">{note.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {note.preview}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="size-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="size-3" />
          <span>{note.lastEdited}</span>
        </div>
      </div>
    </div>
  );
}
