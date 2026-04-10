import type { Task } from "@/lib/types";

export type TaskFormData = {
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  dueTime?: string;
  recurrenceRule?: "DAILY" | "WEEKLY" | "MONTHLY";
};

export type PriorityFilter = "all" | "low" | "medium" | "high";

export const PRIORITY_COLORS: Record<
  NonNullable<Task["priority"]>,
  string
> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};
