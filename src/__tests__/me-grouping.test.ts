import { describe, it, expect } from "vitest";
import { groupMeTasksByDate } from "@/lib/me-grouping";
import type { MeTask } from "@/lib/api/me-api";

function makeTask(overrides: Partial<MeTask> = {}): MeTask {
  return {
    id: Math.random().toString(36).slice(2),
    title: "Task",
    description: null,
    dueDate: null,
    dueTime: null,
    priority: null,
    status: "s",
    statusName: null,
    statusColor: null,
    canonicalBucket: "open",
    completedAt: null,
    parentTaskId: null,
    createdAt: "2026-07-20T00:00:00.000Z",
    workspace: { id: "w", name: "W", isPersonal: false },
    project: null,
    assignees: [],
    ...overrides,
  };
}

const TODAY = "2026-07-20";

describe("groupMeTasksByDate", () => {
  it("routes an undated task to noDate", () => {
    const g = groupMeTasksByDate([makeTask({ dueDate: null })], TODAY);
    expect(g.noDate).toHaveLength(1);
    expect(g.overdue).toHaveLength(0);
  });

  it("routes a past due date to overdue", () => {
    const g = groupMeTasksByDate(
      [makeTask({ dueDate: "2026-07-19T00:00:00.000Z" })],
      TODAY,
    );
    expect(g.overdue).toHaveLength(1);
  });

  it("routes today's date to today", () => {
    const g = groupMeTasksByDate(
      [makeTask({ dueDate: "2026-07-20T00:00:00.000Z" })],
      TODAY,
    );
    expect(g.today).toHaveLength(1);
  });

  it("routes a future date to upcoming", () => {
    const g = groupMeTasksByDate(
      [makeTask({ dueDate: "2026-07-25T00:00:00.000Z" })],
      TODAY,
    );
    expect(g.upcoming).toHaveLength(1);
  });

  it("distributes a mixed batch across all four buckets", () => {
    const g = groupMeTasksByDate(
      [
        makeTask({ dueDate: "2026-07-01T00:00:00.000Z" }),
        makeTask({ dueDate: "2026-07-20T00:00:00.000Z" }),
        makeTask({ dueDate: "2026-08-01T00:00:00.000Z" }),
        makeTask({ dueDate: null }),
      ],
      TODAY,
    );
    expect(g.overdue).toHaveLength(1);
    expect(g.today).toHaveLength(1);
    expect(g.upcoming).toHaveLength(1);
    expect(g.noDate).toHaveLength(1);
  });
});
