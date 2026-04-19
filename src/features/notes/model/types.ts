import type { Note, Project, Task } from "@/lib/types";
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
  isLinkingTask?: boolean;
  /** When set, shows project link chip + picker (main Notes + project note editor). */
  onLinkProject?: (id: string, projectId: string | null) => void;
  onOpenProjectPicker?: () => void;
  isLinkingProject?: boolean;
  projects?: Project[];
  projectsLoading?: boolean;
  onConvertToTask: (id: string) => void;
  isConvertingToTask?: boolean;
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
  /** When set, list API returns only notes linked to this project. */
  filterProjectId: string | null;
  setFilterProjectId: (id: string | null) => void;
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
  linkingTaskNoteIds: Set<string>;
  ensureTasksLoaded: () => void;
  allProjects: Project[];
  projectsLoading: boolean;
  handleLinkProject: (id: string, projectId: string | null) => void;
  linkingProjectNoteIds: Set<string>;
  ensureProjectsLoaded: () => void;
  handleConvertToTask: (id: string) => void;
  convertingNoteIds: Set<string>;
  handleDelete: (id: string) => void;
  handleLoadMore: () => void;
}
