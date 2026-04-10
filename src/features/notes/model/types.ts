import type { Note, Task } from "@/lib/types";

export type NoteUpdateChanges = { title?: string; content?: string };

export interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, changes: NoteUpdateChanges) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onLinkTask: (id: string, taskId: string | null) => void;
  onConvertToTask: (id: string) => void;
  isSaving: boolean;
  tasks: Task[];
}

export interface UseNotesScreenResult {
  workspaceId: string | null;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  allTags: string[];
  notes: Note[];
  total: number;
  allTasks: Task[];
  selectedNote: Note | null;
  isLoading: boolean;
  error: Error | null;
  createIsPending: boolean;
  updateIsPending: boolean;
  handleCreateNote: () => void;
  handleUpdate: (id: string, changes: NoteUpdateChanges) => void;
  handleTagsChange: (id: string, tags: string[]) => void;
  handleLinkTask: (id: string, taskId: string | null) => void;
  handleConvertToTask: (id: string) => void;
  handleDelete: (id: string) => void;
  handleLoadMore: () => void;
}
