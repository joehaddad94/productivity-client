import { describe, it, expect } from "vitest";
import {
  filterTodayTasks,
  filterTodayAllTasks,
  filterOverdueTasks,
  filterUpcomingTasks,
  filterNoDateTasks,
} from "@/lib/task-filters";
import type { Task, TaskStatusDefinition } from "@/lib/types";

// ─── Test fixtures ────────────────────────────────────────────────────────────

const TODAY = "2026-05-09";

const OPEN_STATUS: TaskStatusDefinition = {
  id: "open",
  name: "Open",
  isTerminal: false,
  sortOrder: 0,
  workspaceId: "ws1",
  color: null,
  archivedAt: null,
};

const DONE_STATUS: TaskStatusDefinition = {
  id: "done",
  name: "Done",
  isTerminal: true,
  sortOrder: 1,
  workspaceId: "ws1",
  color: null,
  archivedAt: null,
};

const STATUSES = [OPEN_STATUS, DONE_STATUS];

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    title: "Test task",
    status: "open",
    dueDate: null,
    priority: null,
    projectId: null,
    workspaceId: "ws1",
    createdAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ─── filterTodayTasks ────────────────────────────────────────────────────────

describe("filterTodayTasks", () => {
  it("includes open tasks due today", () => {
    const tasks = [makeTask({ id: "t1", dueDate: TODAY, status: "open" })];
    expect(filterTodayTasks(tasks, TODAY, STATUSES)).toHaveLength(1);
  });

  it("excludes completed tasks due today", () => {
    const tasks = [makeTask({ id: "t1", dueDate: TODAY, status: "done" })];
    expect(filterTodayTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });

  it("excludes tasks due on other days", () => {
    const tasks = [
      makeTask({ id: "t1", dueDate: "2026-05-08", status: "open" }),
      makeTask({ id: "t2", dueDate: "2026-05-10", status: "open" }),
    ];
    expect(filterTodayTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });

  it("excludes tasks with no due date", () => {
    const tasks = [makeTask({ id: "t1", dueDate: null, status: "open" })];
    expect(filterTodayTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });
});

// ─── filterTodayAllTasks ─────────────────────────────────────────────────────

describe("filterTodayAllTasks", () => {
  it("includes both open and completed tasks due today", () => {
    const tasks = [
      makeTask({ id: "t1", dueDate: TODAY, status: "open" }),
      makeTask({ id: "t2", dueDate: TODAY, status: "done" }),
    ];
    expect(filterTodayAllTasks(tasks, TODAY)).toHaveLength(2);
  });
});

// ─── filterOverdueTasks ──────────────────────────────────────────────────────

describe("filterOverdueTasks", () => {
  it("includes open tasks with past due dates", () => {
    const tasks = [makeTask({ id: "t1", dueDate: "2026-05-01", status: "open" })];
    expect(filterOverdueTasks(tasks, TODAY, STATUSES)).toHaveLength(1);
  });

  it("excludes completed overdue tasks", () => {
    const tasks = [makeTask({ id: "t1", dueDate: "2026-05-01", status: "done" })];
    expect(filterOverdueTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });

  it("excludes tasks due today", () => {
    const tasks = [makeTask({ id: "t1", dueDate: TODAY, status: "open" })];
    expect(filterOverdueTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });

  it("excludes future tasks", () => {
    const tasks = [makeTask({ id: "t1", dueDate: "2026-05-15", status: "open" })];
    expect(filterOverdueTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });
});

// ─── filterUpcomingTasks ─────────────────────────────────────────────────────

describe("filterUpcomingTasks", () => {
  it("includes open tasks due in the future", () => {
    const tasks = [makeTask({ id: "t1", dueDate: "2026-05-15", status: "open" })];
    expect(filterUpcomingTasks(tasks, TODAY, STATUSES)).toHaveLength(1);
  });

  it("excludes tasks due today or in the past", () => {
    const tasks = [
      makeTask({ id: "t1", dueDate: TODAY,        status: "open" }),
      makeTask({ id: "t2", dueDate: "2026-05-01", status: "open" }),
    ];
    expect(filterUpcomingTasks(tasks, TODAY, STATUSES)).toHaveLength(0);
  });

  it("sorts by due date ascending", () => {
    const tasks = [
      makeTask({ id: "t1", dueDate: "2026-05-20", status: "open" }),
      makeTask({ id: "t2", dueDate: "2026-05-12", status: "open" }),
      makeTask({ id: "t3", dueDate: "2026-05-15", status: "open" }),
    ];
    const result = filterUpcomingTasks(tasks, TODAY, STATUSES);
    expect(result.map((t) => t.id)).toEqual(["t2", "t3", "t1"]);
  });

  it("respects the limit", () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, dueDate: `2026-05-${String(i + 10).padStart(2, "0")}`, status: "open" }),
    );
    expect(filterUpcomingTasks(tasks, TODAY, STATUSES, 5)).toHaveLength(5);
    expect(filterUpcomingTasks(tasks, TODAY, STATUSES, 3)).toHaveLength(3);
  });
});

// ─── filterNoDateTasks ───────────────────────────────────────────────────────

describe("filterNoDateTasks", () => {
  it("includes open tasks with no due date", () => {
    const tasks = [makeTask({ id: "t1", dueDate: null, status: "open" })];
    expect(filterNoDateTasks(tasks, STATUSES)).toHaveLength(1);
  });

  it("excludes completed tasks with no due date", () => {
    const tasks = [makeTask({ id: "t1", dueDate: null, status: "done" })];
    expect(filterNoDateTasks(tasks, STATUSES)).toHaveLength(0);
  });

  it("excludes tasks that have a due date", () => {
    const tasks = [makeTask({ id: "t1", dueDate: TODAY, status: "open" })];
    expect(filterNoDateTasks(tasks, STATUSES)).toHaveLength(0);
  });

  it("respects the limit", () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, dueDate: null, status: "open" }),
    );
    expect(filterNoDateTasks(tasks, STATUSES, 5)).toHaveLength(5);
    expect(filterNoDateTasks(tasks, STATUSES, 3)).toHaveLength(3);
  });
});
