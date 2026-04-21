/**
 * Shared types for the Tasky app.
 * Use these across components, screens, API, and context.
 */

export interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  /** Server-driven; used for admin-only UI (e.g. bug triage). */
  isAdmin?: boolean;
}

/** In-app bug report (see POST /bug-reports, admin list under /admin/bug-reports). */
export type BugReportStatus = "open" | "triaging" | "fixed" | "wontfix" | "duplicate";

export interface BugReport {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  description: string;
  expected: string | null;
  actual: string | null;
  route: string | null;
  userAgent: string | null;
  contextJson: Record<string, unknown> | null;
  status: BugReportStatus;
  priority: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporterEmail?: string;
  reporterName?: string | null;
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
  description?: string | null;
  status: string;
  color?: string | null;
  createdAt: string;
  _count?: {
    notes: number;
    tasks: number;
  };
}

/** Workspace-defined task workflow status (see task-statuses API). */
export interface TaskStatusDefinition {
  id: string;
  workspaceId: string;
  name: string;
  sortOrder: number;
  isTerminal: boolean;
  color?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: "low" | "medium" | "high" | null;
  /** Task status id (legacy slugs pending | in_progress | completed or server UUIDs). */
  status: string;
  parentTaskId?: string | null;
  subtasks?: Task[];
  focusMinutes?: number;
  sortOrder?: number;
  recurrenceRule?: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  recurrenceParentId?: string | null;
  projectId?: string | null;
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
  type: 'due_today' | 'overdue' | 'daily_agenda' | 'task_completed';
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
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export interface AnalyticsResult {
  dailyStats: DailyStat[];
  totals: {
    tasksCompleted: number;
    focusMinutes: number;
    streak: number;
  };
}
