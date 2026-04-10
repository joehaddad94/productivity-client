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
  dueTime?: string | null;
  priority?: "low" | "medium" | "high" | null;
  status: "pending" | "in_progress" | "completed";
  parentTaskId?: string | null;
  subtasks?: Task[];
  focusMinutes?: number;
  sortOrder?: number;
  recurrenceRule?: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  recurrenceParentId?: string | null;
  completedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
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

export interface AppNotification {
  id: string;
  userId: string;
  workspaceId: string;
  taskId?: string | null;
  type: 'due_today' | 'overdue' | 'daily_agenda';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
  dailyAgendaTime: string;
}

export interface AnalyticsResult {
  dailyStats: DailyStat[];
  totals: {
    tasksCompleted: number;
    focusMinutes: number;
    streak: number;
  };
}
