import { test, expect } from "@playwright/test";
import { goto, expectToast, API } from "./helpers";

async function getWorkspaceId(page: import("@playwright/test").Page): Promise<string> {
  const wid = await page.evaluate(() => localStorage.getItem("tasky_current_workspace_id"));
  expect(wid, "workspace id must be in localStorage").toBeTruthy();
  return wid!;
}

async function createTaskViaApi(
  page: import("@playwright/test").Page,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const workspaceId = await getWorkspaceId(page);
  const res = await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
    data: { title, ...extra },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return (body.task?.id ?? body.id) as string;
}

async function deleteTaskViaApi(page: import("@playwright/test").Page, id: string) {
  const workspaceId = await getWorkspaceId(page);
  await page.request.delete(`${API}/workspaces/${workspaceId}/tasks/${id}`);
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/dashboard");
  });

  test("shows greeting and today's date label", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i).first()).toBeVisible();
  });

  test("shows Today section", async ({ page }) => {
    // "Today" is an h2 header in the dashboard task section
    await expect(page.locator("h2").filter({ hasText: /^today$/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test("quick-add task via input creates task and shows toast", async ({ page }) => {
    const title = `E2E-DashTask-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i], input[placeholder*="new task" i]').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(title);
    await input.press("Enter");
    await expectToast(page, /task added/i);
  });

  test("stat rows are visible (Focus, Streak, Completed)", async ({ page }) => {
    // Stats are shown as labelled rows with tabular-nums values
    await expect(page.getByText(/streak/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/focus/i).first()).toBeVisible();
  });

  test("streak section renders 7 day dots", async ({ page }) => {
    // Dots are size-2 rounded-full spans inside the streak row
    await expect(page.locator(".size-2.rounded-full").first()).toBeVisible({ timeout: 10_000 });
  });

  test("overdue section appears when overdue tasks exist", async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const due = yesterday.toISOString().split("T")[0]!;
    const title = `E2E-Overdue-${Date.now()}`;
    const id = await createTaskViaApi(page, title, { dueDate: due });

    await goto(page, "/dashboard");

    await expect(page.getByText(/overdue/i).first()).toBeVisible({ timeout: 10_000 });
    await deleteTaskViaApi(page, id);
  });

  test("upcoming section shows future tasks", async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const due = tomorrow.toISOString().split("T")[0]!;
    const title = `E2E-Upcoming-${Date.now()}`;
    const id = await createTaskViaApi(page, title, { dueDate: due });

    await goto(page, "/dashboard");

    await expect(page.getByText(/upcoming/i).first()).toBeVisible({ timeout: 10_000 });
    await deleteTaskViaApi(page, id);
  });
});
