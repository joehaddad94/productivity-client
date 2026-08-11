import type { Page, Route } from "@playwright/test";

/**
 * Full stand-in for the API so a spec can exercise the UI without a backend.
 *
 * The real e2e specs authenticate via /auth/dev-session and hit the live
 * database. Anything that only needs to prove UI behaviour should use this
 * instead: it is deterministic, needs no server, and writes nothing.
 */

export const WS = "11111111-1111-4111-8111-111111111111";

const iso = (minutesAgo: number) =>
  new Date(Date.now() - minutesAgo * 60_000).toISOString();

export interface MockNote {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  tags: string[];
  projectId: string | null;
  taskId: string | null;
  assigneeId: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

const note = (
  id: string,
  title: string,
  content: string,
  tags: string[],
  minutesAgo: number,
): MockNote => ({
  id,
  workspaceId: WS,
  title,
  content,
  tags,
  projectId: null,
  taskId: null,
  assigneeId: null,
  status: null,
  createdAt: iso(minutesAgo),
  updatedAt: iso(minutesAgo),
});

export const SEED_NOTES: MockNote[] = [
  note("note-01", "Roadmap sync", "<p>Ship the redesign first.</p><p>Then mobile.</p>", ["standup"], 30),
  note("note-02", "Checklist", '<ul class="task-list"><li data-type="taskItem">Cut branch</li></ul>', ["release"], 200),
  note("note-03", "Empty one", "", [], 1500),
];

export interface MockOptions {
  /** Extra delay on POST /notes, to widen optimistic-update race windows. */
  createDelayMs?: number;
}

/**
 * Routes every API call to in-memory data. Returns a handle whose `created`
 * field holds the note produced by the most recent POST.
 */
export async function mockApi(page: Page, options: MockOptions = {}) {
  const state: { created: MockNote | null } = { created: null };

  await page.route("**://localhost:8000/**", async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    // SSE must not be answered with JSON, or EventSource errors on MIME type.
    if (path.startsWith("/sse/")) return route.abort();

    // Body must be literal null: timerStateApi.get() returns the parsed body
    // as the state, and an object without sessionType crashes the pomodoro
    // widget in the app shell.
    if (path === "/timer-state")
      return route.fulfill({ status: 200, contentType: "application/json", body: "null" });

    if (path === "/auth/me")
      return json({
        user: { id: "user-1", email: "e2e@example.com", name: "E2E", isAdmin: false, timezone: "UTC" },
      });

    if (path === "/workspaces")
      return json({
        workspaces: [{ id: WS, name: "Mock", slug: "mock", isPersonal: false, createdAt: iso(9e4) }],
      });

    if (path.endsWith("/notes") && request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}") as { title?: string };
      state.created = note("note-created", body.title ?? "Untitled Note", "", [], 0);
      if (options.createDelayMs) {
        await new Promise((r) => setTimeout(r, options.createDelayMs));
      }
      return json({ note: state.created });
    }

    if (path.endsWith("/notes")) {
      const notes = state.created ? [state.created, ...SEED_NOTES] : SEED_NOTES;
      return json({ notes, total: notes.length });
    }

    if (path.endsWith("/tags"))
      return json({ tags: [{ tag: "standup", count: 1 }, { tag: "release", count: 1 }] });
    if (path.endsWith("/projects"))
      return json({
        projects: [
          { id: "p1", workspaceId: WS, name: "Mock project", status: "active", createdAt: iso(9e3), _count: { notes: 1, tasks: 0 } },
        ],
        total: 1,
      });
    if (path.endsWith("/task-statuses"))
      return json({
        statuses: [
          { id: "st-open", workspaceId: WS, name: "Open", sortOrder: 0, isTerminal: false, color: "#64748b", archivedAt: null },
        ],
      });
    if (path.endsWith("/tasks")) return json({ tasks: [], total: 0 });
    if (path.startsWith("/notifications")) return json({ notifications: [], unread: 0 });

    // Remaining clients all fall back to [] / null on a missing key.
    return json({});
  });

  return state;
}
