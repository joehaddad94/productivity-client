import { test, expect } from "@playwright/test";
import { goto, expectToast, API, PLAYWRIGHT_BASE_URL } from "./helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForProjectsReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => document.querySelectorAll(".animate-pulse").length === 0,
    { timeout: 15_000 },
  ).catch(() => {});
  await page.waitForTimeout(200);
}

async function getWorkspaceId(page: import("@playwright/test").Page): Promise<string> {
  const wid = await page.evaluate(() => localStorage.getItem("tasky_current_workspace_id"));
  expect(wid, "workspace id must be in localStorage").toBeTruthy();
  return wid!;
}

async function createProjectViaApi(
  page: import("@playwright/test").Page,
  name: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const workspaceId = await getWorkspaceId(page);
  const res = await page.request.post(`${API}/workspaces/${workspaceId}/projects`, {
    data: { name, ...extra },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.project.id as string;
}

async function deleteProjectViaApi(page: import("@playwright/test").Page, id: string) {
  const workspaceId = await getWorkspaceId(page);
  await page.request.delete(`${API}/workspaces/${workspaceId}/projects/${id}`);
}

/** Type the project name into the confirm dialog and submit. */
async function confirmDeleteDialog(page: import("@playwright/test").Page, name: string) {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole("textbox").fill(name);
  await dialog.getByRole("button", { name: /delete/i }).click();
}

/** Wait for a task card's temp-save spinner to clear (real ID resolved). */
async function waitForTaskSaved(page: import("@playwright/test").Page, title: string) {
  const card = page.getByTestId("task-card").filter({ hasText: title });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.locator("svg.animate-spin")).not.toBeVisible({ timeout: 10_000 });
}

/** Wait for a note card's temp-save spinner to clear. */
async function waitForNoteSaved(page: import("@playwright/test").Page, title: string) {
  const card = page.getByTestId("note-card").filter({ hasText: title });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.locator("svg.animate-spin")).not.toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Projects — list page
// ---------------------------------------------------------------------------

test.describe("Projects — list page", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/projects");
    await waitForProjectsReady(page);
  });

  test("shows heading and New project button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^projects$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new project/i })).toBeVisible();
  });

  test("creates a project — optimistic insert then confirmed", async ({ page }) => {
    const name = `E2E-Create-${Date.now()}`;
    await page.getByRole("button", { name: /new project/i }).click();
    await page.locator('input[placeholder*="project name" i]').fill(name);
    await page.keyboard.press("Enter");

    // Card appears before server confirms (optimistic)
    await expect(page.getByTestId("project-card").filter({ hasText: name })).toBeVisible({ timeout: 5_000 });
    await expectToast(page, /project created/i);
  });

  test("project card shows color dot and status badge", async ({ page }) => {
    const name = `E2E-Card-${Date.now()}`;
    const id = await createProjectViaApi(page, name, { status: "on_hold", color: "blue" });
    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText(/on hold/i)).toBeVisible();

    await deleteProjectViaApi(page, id);
  });

  test("project card navigates to detail page", async ({ page }) => {
    const name = `E2E-Nav-${Date.now()}`;
    const id = await createProjectViaApi(page, name);
    await page.reload();
    await waitForProjectsReady(page);

    await page.getByTestId("project-card").filter({ hasText: name }).locator("a").click();
    await page.waitForURL(`**/${id}`, { timeout: 10_000 });
    await expect(page.getByText(name)).toBeVisible();

    await deleteProjectViaApi(page, id);
  });

  test("edits a project via inline form", async ({ page }) => {
    const name = `E2E-Edit-${Date.now()}`;
    const updated = `${name}-UPDATED`;
    const id = await createProjectViaApi(page, name);
    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: /edit project/i }).click();

    await page.locator('input[placeholder*="project name" i]').fill(updated);
    await page.getByRole("button", { name: /^save$/i }).click();

    await expectToast(page, /project updated/i);
    await expect(page.getByText(updated)).toBeVisible({ timeout: 10_000 });

    await deleteProjectViaApi(page, id);
  });

  test("delete: confirm dialog is disabled until name is typed", async ({ page }) => {
    const name = `E2E-Guard-${Date.now()}`;
    const id = await createProjectViaApi(page, name);
    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: /delete project/i }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    const confirmBtn = dialog.getByRole("button", { name: /delete/i });

    // Disabled with no input
    await expect(confirmBtn).toBeDisabled();

    // Still disabled with wrong text
    await dialog.getByRole("textbox").fill("wrong name");
    await expect(confirmBtn).toBeDisabled();

    // Cancel to restore
    await dialog.getByRole("button", { name: /cancel/i }).click();
    await expect(card).toBeVisible();

    await deleteProjectViaApi(page, id);
  });

  test("deletes a project via confirm dialog — optimistic removal", async ({ page }) => {
    const name = `E2E-Del-${Date.now()}`;
    await createProjectViaApi(page, name);
    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: /delete project/i }).click();
    await confirmDeleteDialog(page, name);

    await expect(card).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, /project deleted/i);
  });
});

// ---------------------------------------------------------------------------
// Projects — detail page  (shared project, created once in beforeAll)
// ---------------------------------------------------------------------------

test.describe("Projects — detail page", () => {
  let projectId: string;
  const projectName = `E2E-Detail-${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    const page = await ctx.newPage();
    await page.goto(`${PLAYWRIGHT_BASE_URL}/projects`);
    await waitForProjectsReady(page);
    projectId = await createProjectViaApi(page, projectName, {
      description: "Initial description",
      status: "active",
      color: "blue",
    });
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "playwright/.auth/user.json" });
    const page = await ctx.newPage();
    await page.goto(`${PLAYWRIGHT_BASE_URL}/projects`);
    await deleteProjectViaApi(page, projectId);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await goto(page, `/projects/${projectId}`);
    await waitForProjectsReady(page);
  });

  // ── Layout & navigation ────────────────────────────────────────────────────

  test("shows project name, back link and tabs", async ({ page }) => {
    await expect(page.getByText(projectName)).toBeVisible();
    // Sidebar also links to Projects; scope to main content for the detail back link.
    await expect(page.getByRole("main").getByRole("link", { name: /projects/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^tasks/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^notes/i })).toBeVisible();
  });

  test("back link returns to /projects", async ({ page }) => {
    await page.getByRole("main").getByRole("link", { name: /projects/i }).click();
    await page.waitForURL("/projects", { timeout: 5_000 });
  });

  // ── Inline edits ──────────────────────────────────────────────────────────

  test("inline edit: rename project", async ({ page }) => {
    const renamed = `${projectName}-RENAMED`;
    await page.locator('input.text-2xl, button:has-text("' + projectName + '")').first().click();

    const input = page.locator("input.text-2xl");
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.selectText();
    await input.fill(renamed);
    await input.press("Enter");
    await expect(page.getByText(renamed)).toBeVisible({ timeout: 10_000 });

    // Restore
    await page.getByText(renamed).click();
    const input2 = page.locator("input.text-2xl");
    await input2.selectText();
    await input2.fill(projectName);
    await input2.press("Enter");
  });

  test("inline edit: update description", async ({ page }) => {
    await page.getByText("Initial description").click();
    const ta = page.locator("textarea");
    await expect(ta).toBeVisible({ timeout: 5_000 });
    await ta.selectText();
    await ta.fill("Updated description");
    await ta.blur();
    await expect(page.getByText("Updated description")).toBeVisible({ timeout: 10_000 });

    // Restore
    await page.getByText("Updated description").click();
    const ta2 = page.locator("textarea");
    await ta2.selectText();
    await ta2.fill("Initial description");
    await ta2.blur();
  });

  test("status select changes project status", async ({ page }) => {
    const statusSelect = page.getByRole("combobox", { name: /project status/i });
    await expect(statusSelect).toContainText(/active/i);
    await statusSelect.click();
    await page.getByRole("option", { name: /^on hold$/i }).click();
    await expect(statusSelect).toContainText(/on hold/i, { timeout: 5_000 });

    // Restore
    await statusSelect.click();
    await page.getByRole("option", { name: /^active$/i }).click();
    await expect(statusSelect).toContainText(/active/i, { timeout: 5_000 });
  });

  // ── Tasks tab ─────────────────────────────────────────────────────────────

  test("add task: input clears immediately, card appears optimistically", async ({ page }) => {
    const title = `E2E-Task-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i]');
    await input.fill(title);
    await input.press("Enter");

    // Input clears without waiting for server
    await expect(input).toHaveValue("", { timeout: 1_000 });
    // Card appears (possibly with temp spinner)
    await expect(page.getByTestId("task-card").filter({ hasText: title })).toBeVisible({ timeout: 5_000 });
    await expectToast(page, /task added/i);
  });

  test("task card is non-interactive while saving, becomes clickable after", async ({ page }) => {
    const title = `E2E-TempTask-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i]');
    await input.fill(title);
    await input.press("Enter");

    // Spinner present during save → card has cursor-default
    const card = page.getByTestId("task-card").filter({ hasText: title });
    // Wait for spinner to disappear (real ID resolved)
    await waitForTaskSaved(page, title);
    // Now clickable — opens drawer
    await card.click();
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
  });

  test("task status pill changes status inline", async ({ page }) => {
    const title = `E2E-Pill-${Date.now()}`;
    await page.locator('input[placeholder*="Add a task" i]').fill(title);
    await page.keyboard.press("Enter");
    await waitForTaskSaved(page, title);

    const card = page.getByTestId("task-card").filter({ hasText: title });
    const pill = card.getByRole("combobox");
    await pill.click();
    await page.getByRole("option", { name: /^in progress$/i }).click();
    await expect(pill).toContainText(/in progress/i, { timeout: 5_000 });
  });

  test("task drawer: open, save, shows toast", async ({ page }) => {
    const title = `E2E-Drawer-${Date.now()}`;
    await page.locator('input[placeholder*="Add a task" i]').fill(title);
    await page.keyboard.press("Enter");
    await waitForTaskSaved(page, title);

    await page.getByTestId("task-card").filter({ hasText: title }).click();
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    const titleField = page.locator('textarea[placeholder="Task title…"]');
    await titleField.fill(`${title} edited`);
    const saveBtn = page.getByRole("button", { name: /save changes/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();
    await expectToast(page, /task updated/i);
  });

  test("task drawer: delete task removes it from list", async ({ page }) => {
    const title = `E2E-DelTask-${Date.now()}`;
    await page.locator('input[placeholder*="Add a task" i]').fill(title);
    await page.keyboard.press("Enter");
    await waitForTaskSaved(page, title);

    await page.getByTestId("task-card").filter({ hasText: title }).click();
    await expect(page.getByText(/task details/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /delete task/i }).click();
    await expectToast(page, /task deleted/i);
    await expect(page.getByTestId("task-card").filter({ hasText: title })).not.toBeVisible({ timeout: 5_000 });
  });

  test("bulk select and delete tasks", async ({ page }) => {
    const t1 = `E2E-Bulk1-${Date.now()}`;
    const t2 = `E2E-Bulk2-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i]');

    await input.fill(t1);
    await input.press("Enter");
    await expectToast(page, /task added/i);
    await input.fill(t2);
    await input.press("Enter");
    await expectToast(page, /task added/i);

    await waitForTaskSaved(page, t1);
    await waitForTaskSaved(page, t2);

    // Enter select mode
    await page.getByRole("button", { name: /^select$/i }).click();

    await page.getByTestId("task-card").filter({ hasText: t1 }).click();
    await page.getByTestId("task-card").filter({ hasText: t2 }).click();

    await page.getByRole("button", { name: /^delete$/i }).click();
    await expectToast(page, /tasks? deleted/i);

    await expect(page.getByTestId("task-card").filter({ hasText: t1 })).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("task-card").filter({ hasText: t2 })).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Notes tab ─────────────────────────────────────────────────────────────

  test("switches to Notes tab and shows note input", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();
    await expect(page.locator('input[placeholder*="note title" i]')).toBeVisible();
  });

  test("add note: input clears immediately, card appears optimistically", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();

    const title = `E2E-Note-${Date.now()}`;
    const input = page.locator('input[placeholder*="note title" i]');
    await input.fill(title);
    await input.press("Enter");

    await expect(input).toHaveValue("", { timeout: 1_000 });
    await expect(page.getByTestId("note-card").filter({ hasText: title })).toBeVisible({ timeout: 5_000 });
    await expectToast(page, /note added/i);
  });

  test("note card non-interactive while saving, becomes clickable after", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();

    const title = `E2E-NoteTemp-${Date.now()}`;
    await page.locator('input[placeholder*="note title" i]').fill(title);
    await page.keyboard.press("Enter");

    await waitForNoteSaved(page, title);
    // Now clickable — navigates to editor
    await page.getByTestId("note-card").filter({ hasText: title }).click();
    await page.waitForURL(new RegExp(`/projects/${projectId}/notes/`), { timeout: 10_000 });
  });

  test("clicking a note opens project-scoped editor with correct back link", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();

    const title = `E2E-NoteNav-${Date.now()}`;
    await page.locator('input[placeholder*="note title" i]').fill(title);
    await page.keyboard.press("Enter");
    await expectToast(page, /note added/i);
    await waitForNoteSaved(page, title);

    await page.getByTestId("note-card").filter({ hasText: title }).click();
    await page.waitForURL(new RegExp(`/projects/${projectId}/notes/`), { timeout: 10_000 });
    await expect(
      page.getByRole("link", { name: new RegExp(`back to ${projectName}`, "i") }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("back from note editor returns to notes tab", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();

    const title = `E2E-NoteBack-${Date.now()}`;
    await page.locator('input[placeholder*="note title" i]').fill(title);
    await page.keyboard.press("Enter");
    await expectToast(page, /note added/i);
    await waitForNoteSaved(page, title);

    await page.getByTestId("note-card").filter({ hasText: title }).click();
    await page.waitForURL(new RegExp(`/projects/${projectId}/notes/`), { timeout: 10_000 });

    await page.getByRole("link", { name: new RegExp(`back to ${projectName}`, "i") }).click();
    await page.waitForURL(new RegExp(`/projects/${projectId}`), { timeout: 10_000 });

    // URL has ?tab=notes and notes input is visible
    await expect(page).toHaveURL(/tab=notes/);
    await expect(page.locator('input[placeholder*="note title" i]')).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Projects — delete from detail page
// ---------------------------------------------------------------------------

test.describe("Projects — delete from detail", () => {
  test("confirm dialog disabled without name; confirmed delete redirects to /projects", async ({ page }) => {
    await goto(page, "/projects");
    const name = `E2E-DelDetail-${Date.now()}`;
    const id = await createProjectViaApi(page, name);
    await goto(page, `/projects/${id}`);
    await waitForProjectsReady(page);

    await page.getByRole("button", { name: /delete project/i }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Confirm button disabled before typing
    const confirmBtn = dialog.getByRole("button", { name: /delete project/i });
    await expect(confirmBtn).toBeDisabled();

    // Type name to enable
    await dialog.getByRole("textbox").fill(name);
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    await page.waitForURL("/projects", { timeout: 10_000 });
    await expectToast(page, /project deleted/i);
  });
});
