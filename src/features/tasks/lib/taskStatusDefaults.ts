import type { TaskStatusDefinition } from "@/lib/types";

/** Built-in IDs match legacy `task.status` strings until the API returns UUIDs. */
export const LEGACY_PENDING = "pending";
export const LEGACY_IN_PROGRESS = "in_progress";
export const LEGACY_COMPLETED = "completed";

export function getDefaultTaskStatuses(workspaceId: string): TaskStatusDefinition[] {
  return [
    {
      id: LEGACY_PENDING,
      workspaceId,
      name: "Pending",
      sortOrder: 0,
      isTerminal: false,
      color: null,
      archivedAt: null,
    },
    {
      id: LEGACY_IN_PROGRESS,
      workspaceId,
      name: "In progress",
      sortOrder: 1,
      isTerminal: false,
      color: null,
      archivedAt: null,
    },
    {
      id: LEGACY_COMPLETED,
      workspaceId,
      name: "Completed",
      sortOrder: 2,
      isTerminal: true,
      color: null,
      archivedAt: null,
    },
  ];
}
