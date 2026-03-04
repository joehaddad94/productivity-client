/**
 * Shared types for the Tasky app.
 * Use these across components, screens, API, and context.
 */

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  status?: string;
  overdue?: boolean;
  project?: string;
}

export interface Note {
  id: string;
  title: string;
  preview: string;
  tags?: string[];
  lastEdited: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  createdAt: string;
}
