import type { Task, TaskStatusDefinition } from "@/lib/types";
import {
  LEGACY_COMPLETED,
  LEGACY_IN_PROGRESS,
  LEGACY_PENDING,
  getDefaultTaskStatuses,
} from "./taskStatusDefaults";

export function activeTaskStatuses(statuses: TaskStatusDefinition[]): TaskStatusDefinition[] {
  return statuses
    .filter((s) => !s.archivedAt)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function statusById(
  statuses: TaskStatusDefinition[],
  id: string | null | undefined,
): TaskStatusDefinition | undefined {
  if (!id) return undefined;
  return statuses.find((s) => s.id === id && !s.archivedAt);
}

/** Completed / done-like for UI (line-through, hide from “open” lists, etc.). */
export function isTaskStatusTerminal(
  statusId: string | null | undefined,
  statuses: TaskStatusDefinition[],
): boolean {
  const s = statusById(statuses, statusId);
  if (s) return s.isTerminal;
  return statusId === LEGACY_COMPLETED;
}

export function defaultNonTerminalStatusId(statuses: TaskStatusDefinition[]): string {
  const active = activeTaskStatuses(statuses);
  const first = active.find((s) => !s.isTerminal);
  return first?.id ?? LEGACY_PENDING;
}

export function firstTerminalStatusId(statuses: TaskStatusDefinition[]): string {
  const active = activeTaskStatuses(statuses);
  const t = active.find((s) => s.isTerminal);
  return t?.id ?? LEGACY_COMPLETED;
}

/** Label for pills / selects; falls back to id. */
export function taskStatusLabel(
  statusId: string | null | undefined,
  statuses: TaskStatusDefinition[],
): string {
  return statusById(statuses, statusId)?.name ?? statusId ?? "Unknown";
}

/** Dot + badge classes for a status. When `color` is returned, callers should apply it via inline style. */
export function taskStatusVisual(
  statusId: string,
  statuses: TaskStatusDefinition[],
): { dot: string; label: string; badge: string; color?: string } {
  const s = statusById(statuses, statusId);
  const label = s?.name ?? statusId;
  if (s?.color) {
    return {
      dot: "bg-muted-foreground/30",
      label,
      badge: "border-border/40 text-muted-foreground",
      color: s.color,
    };
  }
  if (statusId === LEGACY_PENDING) {
    return {
      dot: "bg-muted-foreground/40",
      label,
      badge: "border-border/60 text-muted-foreground",
    };
  }
  if (statusId === LEGACY_IN_PROGRESS) {
    return {
      dot: "bg-blue-500",
      label,
      badge: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5",
    };
  }
  if (statusId === LEGACY_COMPLETED || s?.isTerminal) {
    return {
      dot: "bg-green-500",
      label,
      badge: "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5",
    };
  }
  return {
    dot: "bg-primary/60",
    label,
    badge: "border-border/60 text-foreground bg-muted/40",
  };
}

export function ensureTaskStatuses(
  workspaceId: string | null | undefined,
  statuses: TaskStatusDefinition[] | undefined,
): TaskStatusDefinition[] {
  if (!workspaceId) return getDefaultTaskStatuses("");
  const list = statuses && statuses.length > 0 ? statuses : getDefaultTaskStatuses(workspaceId);
  return list;
}

export function taskMatchesStatusFilter(task: Task, statusId: string | undefined): boolean {
  if (!statusId) return true;
  return task.status === statusId;
}
