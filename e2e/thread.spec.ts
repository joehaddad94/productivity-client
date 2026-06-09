import { test, expect } from "@playwright/test";
import { goto, API } from "./helpers";

async function getWorkspaceId(page: import("@playwright/test").Page): Promise<string> {
  const wid = await page.evaluate(() => localStorage.getItem("tasky_current_workspace_id"));
  expect(wid, "workspace id must be in localStorage").toBeTruthy();
  return wid!;
}

async function createTask(page: import("@playwright/test").Page, title: string): Promise<string> {
  const workspaceId = await getWorkspaceId(page);
  const res = await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
    data: { title },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return (body.task?.id ?? body.id) as string;
}

async function deleteTask(page: import("@playwright/test").Page, id: string) {
  const workspaceId = await getWorkspaceId(page);
  await page.request.delete(`${API}/workspaces/${workspaceId}/tasks/${id}`);
}

async function openDrawer(page: import("@playwright/test").Page, title: string) {
  const search = page.locator('[aria-label="Search tasks"]');
  await search.clear();
  await search.fill(title);
  await page.waitForTimeout(600);
  const row = page.getByTestId("task-row").filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.hover();
  await row.getByTitle("Open details").click();
  await expect(page.locator('textarea[placeholder="Task title…"]')).toBeVisible({ timeout: 10_000 });
}

test.describe("Thread — Comments & Activity", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/tasks");
  });

  test("drawer shows Comments & Activity section", async ({ page }) => {
    const title = `E2E-Thread-Section-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);

    // Section header is visible
    await expect(page.getByText("Comments & Activity")).toBeVisible({ timeout: 5_000 });

    await deleteTask(page, id);
  });

  test("created activity appears in thread", async ({ page }) => {
    const title = `E2E-Thread-Created-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);

    // Scroll to comments section
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();

    // "created this task" activity from server
    await expect(page.getByText("created this task")).toBeVisible({ timeout: 10_000 });

    await deleteTask(page, id);
  });

  test("post a comment and it appears in thread", async ({ page }) => {
    const title = `E2E-Thread-Comment-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();

    const textarea = page.locator('textarea[placeholder="Add a comment… (⌘Enter to post)"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    const comment = `Test comment ${Date.now()}`;
    await textarea.fill(comment);

    // Click the send button (the button next to the textarea)
    const sendBtn = page.locator(".border-t button[type='button']").last();
    await sendBtn.click();

    // Comment appears in the thread
    await expect(page.getByText(comment)).toBeVisible({ timeout: 10_000 });
    // Textarea clears after post
    await expect(textarea).toHaveValue("");

    await deleteTask(page, id);
  });

  test("post comment with Ctrl+Enter shortcut", async ({ page }) => {
    const title = `E2E-Thread-Shortcut-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();

    const textarea = page.locator('textarea[placeholder="Add a comment… (⌘Enter to post)"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    const comment = `Shortcut comment ${Date.now()}`;
    await textarea.fill(comment);
    await textarea.press("Control+Enter");

    await expect(page.getByText(comment)).toBeVisible({ timeout: 10_000 });

    await deleteTask(page, id);
  });

  test("delete own comment removes it from thread", async ({ page }) => {
    const title = `E2E-Thread-Delete-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();

    const textarea = page.locator('textarea[placeholder="Add a comment… (⌘Enter to post)"]');
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    const comment = `Delete me ${Date.now()}`;
    await textarea.fill(comment);
    await textarea.press("Control+Enter");
    await expect(page.getByText(comment)).toBeVisible({ timeout: 10_000 });

    // Hover over the comment bubble to reveal the delete button
    const commentBubble = page.locator(".rounded-lg.bg-muted\\/60").filter({ hasText: comment });
    await commentBubble.hover();
    const deleteBtn = page.locator('[aria-label="Delete comment"]');
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.click();

    // Comment disappears (optimistic removal)
    await expect(page.getByText(comment)).not.toBeVisible({ timeout: 5_000 });

    await deleteTask(page, id);
  });

  test("status change generates activity in thread", async ({ page }) => {
    const title = `E2E-Thread-Status-${Date.now()}`;
    const id = await createTask(page, title);

    await openDrawer(page, title);

    // Change status via the select in the drawer
    const statusSelect = page.locator('[role="dialog"]').getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: /^in progress$/i }).click();

    // Wait for save (300ms debounce) + SSE thread_changed → thread re-fetch
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();
    await expect(
      page.getByText(/changed status to/i)
    ).toBeVisible({ timeout: 15_000 });

    await deleteTask(page, id);
  });

  test("title rename generates activity in thread", async ({ page }) => {
    const title = `E2E-Thread-Rename-${Date.now()}`;
    const id = await createTask(page, title);
    await page.reload();
    await goto(page, "/tasks");

    await openDrawer(page, title);

    const titleField = page.locator('textarea[placeholder="Task title…"]');
    await expect(titleField).toBeVisible({ timeout: 10_000 });
    const newTitle = `${title}-renamed`;
    await titleField.fill(newTitle);

    // Wait for the 1500ms debounce + server round-trip + SSE thread_changed → thread re-fetch
    await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 10_000 });
    await page.getByText("Comments & Activity").scrollIntoViewIfNeeded();

    await expect(
      page.getByText(new RegExp(`renamed to "${newTitle}"`, "i"))
    ).toBeVisible({ timeout: 15_000 });

    await deleteTask(page, id);
  });
});
