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

/**
 * Search for a task to make it visible in the virtualized list.
 * TasksScreen uses data-testid="task-row" (not task-card).
 */
async function findTask(page: import("@playwright/test").Page, title: string) {
  const search = page.locator('[aria-label="Search tasks"]');
  await search.clear();
  await search.fill(title);
  // Wait for debounce (300ms) + re-render
  await page.waitForTimeout(600);
  return page.getByTestId("task-row").filter({ hasText: title });
}

test.describe("Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/tasks");
  });

  test("shows Tasks heading and New Task button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^tasks$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /new task/i })).toBeVisible();
  });

  test("creates a task via modal and appears in list", async ({ page }) => {
    const title = `E2E-Task-${Date.now()}`;
    await page.getByRole("button", { name: /new task/i }).click();
    // Wait for the modal input — portal takes an extra frame
    const titleInput = page.locator('input[placeholder="What needs to be done?"]');
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill(title);
    await page.getByRole("button", { name: /^create/i }).click();
    await expectToast(page, /task (added|created)/i);
    const row = await findTask(page, title);
    await expect(row).toBeVisible({ timeout: 10_000 });
  });

  test("search filters task list", async ({ page }) => {
    const title = `E2E-Search-${Date.now()}`;
    const id = await createTaskViaApi(page, title);
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await expect(row).toBeVisible({ timeout: 10_000 });

    await deleteTaskViaApi(page, id);
  });

  test("opens task drawer on click", async ({ page }) => {
    const title = `E2E-Drawer-${Date.now()}`;
    const id = await createTaskViaApi(page, title);
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Drawer opens via "Open details" button (visible on hover)
    await row.hover();
    await row.getByTitle("Open details").click();
    await expect(page.locator('textarea[placeholder="Task title…"]')).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");

    await deleteTaskViaApi(page, id);
  });

  test("task drawer: edit title and auto-saves", async ({ page }) => {
    const title = `E2E-Edit-${Date.now()}`;
    const id = await createTaskViaApi(page, title);
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await row.hover();
    await row.getByTitle("Open details").click();
    const titleField = page.locator('textarea[placeholder="Task title…"]');
    await expect(titleField).toBeVisible({ timeout: 10_000 });
    await titleField.fill(`${title}-edited`);
    // Drawer auto-saves after 700ms debounce
    await expect(page.getByText(/all changes saved/i)).toBeVisible({ timeout: 10_000 });

    await deleteTaskViaApi(page, id);
  });

  test("task drawer: delete task removes it from list", async ({ page }) => {
    const title = `E2E-Del-${Date.now()}`;
    await createTaskViaApi(page, title);
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await row.hover();
    await row.getByTitle("Open details").click();
    await expect(page.locator('textarea[placeholder="Task title…"]')).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /^delete$/i }).click();
    // Confirm the AlertDialog that appears
    await page.getByRole("alertdialog").getByRole("button", { name: /^delete$/i }).click();
    await expectToast(page, /task deleted/i);
    await expect(page.getByTestId("task-row").filter({ hasText: title })).not.toBeVisible({ timeout: 5_000 });
  });

  test("status pill changes task status", async ({ page }) => {
    const title = `E2E-Status-${Date.now()}`;
    const id = await createTaskViaApi(page, title);
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // First combobox in the row is the status selector
    const pill = row.getByRole("combobox").first();
    await pill.click();
    await page.getByRole("option", { name: /^in progress$/i }).click();
    // After status change the task moves to the "In Progress" tab and leaves the current tab
    await expect(row).not.toBeVisible({ timeout: 5_000 });

    await deleteTaskViaApi(page, id);
  });

  test("recurring task shows repeat rule in drawer", async ({ page }) => {
    const title = `E2E-Recurring-${Date.now()}`;
    const id = await createTaskViaApi(page, title, { recurrenceRule: "DAILY" });
    await page.reload();
    await goto(page, "/tasks");

    const row = await findTask(page, title);
    await expect(row).toBeVisible({ timeout: 10_000 });
    // Open the drawer — recurrence is shown in the Repeat field (desktop sidebar)
    await row.hover();
    await row.getByTitle("Open details").click();
    await expect(page.locator('textarea[placeholder="Task title…"]')).toBeVisible({ timeout: 10_000 });
    // Repeat field in the drawer shows "Daily" — scope to the drawer to avoid hidden mobile spans
    await expect(page.locator('[role="dialog"]').getByText("Daily").first()).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");

    await deleteTaskViaApi(page, id);
  });
});
