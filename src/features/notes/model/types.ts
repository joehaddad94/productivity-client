import type { Note, Task } from "@/lib/types";
import type { WorkspaceTag } from "@/lib/api/tags-api";

export type NoteUpdateChanges = { title?: string; content?: string };
export type TagMode = "any" | "all";

export interface NoteEditorProps {
  note: Note;
  existingTags: string[];
  onUpdate: (id: string, changes: NoteUpdateChanges) => void;
  onAddTags: (id: string, tags: string[]) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onTagClick?: (tag: string) => void;
  onLinkTask: (id: string, taskId: string | null) => void;
  onOpenTaskPicker?: () => void;
  onConvertToTask: (id: string) => void;
  isSaving: boolean;
  tasksLoading?: boolean;
  tasks: Task[];
}

export interface UseNotesScreenResult {
  workspaceId: string | null;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  tagMode: TagMode;
  setTagMode: (mode: TagMode) => void;
  allTags: WorkspaceTag[];
  notes: Note[];
  total: number;
  allTasks: Task[];
  tasksLoading: boolean;
  selectedNote: Note | null;
  isLoading: boolean;
  error: Error | null;
  createIsPending: boolean;
  updateIsPending: boolean;
  handleCreateNote: () => void;
  handleUpdate: (id: string, changes: NoteUpdateChanges) => void;
  handleAddTags: (id: string, tags: string[]) => void;
  handleRemoveTag: (id: string, tag: string) => void;
  handleLinkTask: (id: string, taskId: string | null) => void;
  ensureTasksLoaded: () => void;
  handleConvertToTask: (id: string) => void;
  handleDelete: (id: string) => void;
  handleLoadMore: () => void;
}
