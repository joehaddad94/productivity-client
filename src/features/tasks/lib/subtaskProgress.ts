import type { Task, TaskStatusDefinition } from "@/lib/types";
import { isTaskStatusTerminal } from "./taskStatusHelpers";

/** Done/total for parent tasks that have `subtasks`; matches Tasks list semantics. */
export function getSubtaskProgress(
  task: Task,
  taskStatuses: TaskStatusDefinition[],
): { done: number; total: number; pct: number } | null {
  const subs = task.subtasks;
  if (!subs?.length) return null;
  let done = 0;
  for (const s of subs) {
    if (isTaskStatusTerminal(s.status, taskStatuses)) done += 1;
  }
  const total = subs.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}
