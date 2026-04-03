/**
 * Shared types for the Tasky app.
 * Use these across components, screens, API, and context.
 */

export interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  _count?: {
    notes: number;
  };
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: "low" | "medium" | "high" | null;
  status: "pending" | "in_progress" | "completed";
  parentTaskId?: string | null;
  subtasks?: Task[];
  completedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  // Legacy fields kept for compatibility with existing components
  completed?: boolean;
  overdue?: boolean;
  tags?: string[];
  project?: string;
}

export interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content?: string | null;
  tags: string[];
  projectId?: string | null;
  taskId?: string | null;
  assigneeId?: string | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy field for NoteCard compatibility
  preview?: string;
  lastEdited?: string;
}

export interface DailyStat {
  id: string;
  workspaceId: string;
  userId: string;
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
  createdAt: string;
}

export interface AnalyticsResult {
  dailyStats: DailyStat[];
  totals: {
    tasksCompleted: number;
    focusMinutes: number;
    streak: number;
  };
}
