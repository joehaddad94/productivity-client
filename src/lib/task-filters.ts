/**
 * Pure task filtering/categorisation functions used across the app.
 */
import type { Task, TaskStatusDefinition } from "@/lib/types";
import { isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";

export function filterTodayTasks(
  tasks: Task[],
  todayStr: string,
  statuses: TaskStatusDefinition[],
): Task[] {
  return tasks.filter(
    (t) => t.dueDate && t.dueDate.startsWith(todayStr) && !isTaskStatusTerminal(t.status, statuses),
  );
}

export function filterTodayAllTasks(tasks: Task[], todayStr: string): Task[] {
  return tasks.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr));
}

export function filterOverdueTasks(
  tasks: Task[],
  todayStr: string,
  statuses: TaskStatusDefinition[],
): Task[] {
  return tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate.split("T")[0] < todayStr &&
      !isTaskStatusTerminal(t.status, statuses),
  );
}

export function filterUpcomingTasks(
  tasks: Task[],
  todayStr: string,
  statuses: TaskStatusDefinition[],
  limit = 5,
): Task[] {
  return tasks
    .filter(
      (t) =>
        t.dueDate &&
        t.dueDate.slice(0, 10) > todayStr &&
        !isTaskStatusTerminal(t.status, statuses),
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, limit);
}

export function filterNoDateTasks(
  tasks: Task[],
  statuses: TaskStatusDefinition[],
  limit = 5,
): Task[] {
  return tasks
    .filter((t) => !t.dueDate && !isTaskStatusTerminal(t.status, statuses))
    .slice(0, limit);
}
