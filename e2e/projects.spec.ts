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

/** Read workspace id from localStorage (set by the app after login). */
async function getWorkspaceId(page: import("@playwright/test").Page): Promise<string> {
  const wid = await page.evaluate(() => localStorage.getItem("tasky_current_workspace_id"));
  expect(wid, "workspace id must be in localStorage").toBeTruthy();
  return wid!;
}

/** Create a project via API and return its id. */
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

/** Delete a project via API. */
async function deleteProjectViaApi(page: import("@playwright/test").Page, id: string) {
  const workspaceId = await getWorkspaceId(page);
  await page.request.delete(`${API}/workspaces/${workspaceId}/projects/${id}`);
}

// ---------------------------------------------------------------------------
// Projects List
// ---------------------------------------------------------------------------

test.describe("Projects — list page", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/projects");
    await waitForProjectsReady(page);
  });

  test("shows Projects heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^projects$/i })).toBeVisible();
  });

  test("shows New project button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /new project/i })).toBeVisible();
  });

  test("creates a project via the inline form", async ({ page }) => {
    const name = `E2E-Project-${Date.now()}`;
    await page.getByRole("button", { name: /new project/i }).click();

    const nameInput = page.locator('input[placeholder*="project name" i]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
    await page.keyboard.press("Enter");

    await expectToast(page, /project created/i);
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });

  test("project card is clickable and navigates to detail", async ({ page }) => {
    const name = `E2E-Click-${Date.now()}`;
    const id = await createProjectViaApi(page, name);

    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.locator("a").click();

    await page.waitForURL(`**/${id}`, { timeout: 10_000 });
    await expect(page.getByText(name)).toBeVisible();

    await deleteProjectViaApi(page, id);
  });

  test("project card shows status badge", async ({ page }) => {
    const name = `E2E-Status-${Date.now()}`;
    const id = await createProjectViaApi(page, name, { status: "on_hold" });

    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card.getByText(/on hold/i)).toBeVisible();

    await deleteProjectViaApi(page, id);
  });

  test("edits a project name inline from the list", async ({ page }) => {
    const name = `E2E-Edit-${Date.now()}`;
    const updated = `${name}-UPDATED`;
    const id = await createProjectViaApi(page, name);

    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: /edit project/i }).click();

    const nameInput = page.locator('input[placeholder*="project name" i]');
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill(updated);
    await page.getByRole("button", { name: /^save$/i }).click();

    await expectToast(page, /project updated/i);
    await expect(page.getByText(updated)).toBeVisible({ timeout: 10_000 });

    await deleteProjectViaApi(page, id);
  });

  test("deletes a project with optimistic removal and undo", async ({ page }) => {
    const name = `E2E-Del-${Date.now()}`;
    await createProjectViaApi(page, name);

    await page.reload();
    await waitForProjectsReady(page);

    const card = page.getByTestId("project-card").filter({ hasText: name });
    await card.hover();
    await card.getByRole("button", { name: /delete project/i }).click();

    // Card disappears immediately (optimistic)
    await expect(card).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, /project deleted/i);

    // Undo restores it
    await page.getByRole("button", { name: /undo/i }).click();
    await expect(page.getByTestId("project-card").filter({ hasText: name })).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Project Detail
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
    await waitForProjectsReady(page);
    await deleteProjectViaApi(page, projectId);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await goto(page, `/projects/${projectId}`);
    await waitForProjectsReady(page);
  });

  test("shows the project name", async ({ page }) => {
    await expect(page.getByText(projectName)).toBeVisible();
  });

  test("shows back link to projects", async ({ page }) => {
    await expect(page.getByRole("link", { name: /projects/i })).toBeVisible();
  });

  test("shows Tasks and Notes tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^tasks/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^notes/i })).toBeVisible();
  });

  test("inline edit: rename the project", async ({ page }) => {
    const newName = `${projectName}-RENAMED`;
    await page.getByText(projectName).click();

    const input = page.locator('input.text-2xl');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.selectText();
    await input.fill(newName);
    await input.press("Enter");

    await expect(page.getByText(newName)).toBeVisible({ timeout: 10_000 });

    // Rename back so other tests don't break
    await page.getByText(newName).click();
    const input2 = page.locator('input.text-2xl');
    await input2.selectText();
    await input2.fill(projectName);
    await input2.press("Enter");
  });

  test("inline edit: update the description", async ({ page }) => {
    await page.getByText("Initial description").click();

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible({ timeout: 5_000 });
    await textarea.selectText();
    await textarea.fill("Updated description");
    await textarea.blur();

    await expect(page.getByText("Updated description")).toBeVisible({ timeout: 10_000 });

    // Restore
    await page.getByText("Updated description").click();
    const textarea2 = page.locator("textarea");
    await textarea2.selectText();
    await textarea2.fill("Initial description");
    await textarea2.blur();
  });

  test("status badge cycles on click", async ({ page }) => {
    // Should start as Active
    const statusBtn = page.getByTitle(/click to set/i);
    await expect(statusBtn).toContainText(/active/i);

    await statusBtn.click();
    await expect(statusBtn).toContainText(/on hold/i, { timeout: 5_000 });

    await statusBtn.click();
    await expect(statusBtn).toContainText(/completed/i, { timeout: 5_000 });

    // Cycle back to active
    await statusBtn.click();
    await expect(statusBtn).toContainText(/active/i, { timeout: 5_000 });
  });

  test("adds a task from the detail page", async ({ page }) => {
    const taskTitle = `E2E-Task-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i]');
    await expect(input).toBeVisible();
    await input.fill(taskTitle);
    await input.press("Enter");

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 12_000 });
  });

  test("opens task drawer and can mark completed", async ({ page }) => {
    const taskTitle = `E2E-Toggle-${Date.now()}`;
    const input = page.locator('input[placeholder*="Add a task" i]');
    await input.fill(taskTitle);
    await input.press("Enter");
    await expectToast(page, /task added/i);

    const taskCard = page.getByTestId("task-card").filter({ hasText: taskTitle });
    await expect(taskCard).toBeVisible({ timeout: 10_000 });
    await taskCard.click();
    await expect(page.getByText("Task details")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /^completed$/i }).click();
    await page.getByRole("button", { name: /save changes/i }).click();
    await expectToast(page, /task updated/i);
    await expect(taskCard).toBeVisible();
  });

  test("switches to Notes tab", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();
    await expect(page.locator('input[placeholder*="note title" i]')).toBeVisible();
  });

  test("adds a note from the detail page", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();

    const noteTitle = `E2E-Note-${Date.now()}`;
    const input = page.locator('input[placeholder*="note title" i]');
    await expect(input).toBeVisible();
    await input.fill(noteTitle);
    await input.press("Enter");

    await expectToast(page, /note added/i);
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a note opens project-scoped editor", async ({ page }) => {
    await page.getByRole("button", { name: /^notes/i }).click();
    const noteTitle = `E2E-NoteNav-${Date.now()}`;
    await page.locator('input[placeholder*="note title" i]').fill(noteTitle);
    await page.keyboard.press("Enter");
    await expectToast(page, /note added/i);

    await page.getByText(noteTitle).click();
    await page.waitForURL(
      new RegExp(`/projects/${projectId}/notes/`),
      { timeout: 10_000 },
    );
    await expect(
      page.getByRole("link", { name: new RegExp(`back to ${projectName}`, "i") }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("back link returns to /projects", async ({ page }) => {
    await page.getByRole("link", { name: /projects/i }).click();
    await page.waitForURL("/projects", { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Project Detail — delete
// ---------------------------------------------------------------------------

test.describe("Projects — delete from detail", () => {
  test("delete project redirects to /projects", async ({ page }) => {
    await goto(page, "/projects");
    const name = `E2E-DeleteDetail-${Date.now()}`;
    const id = await createProjectViaApi(page, name);

    await goto(page, `/projects/${id}`);
    await waitForProjectsReady(page);

    await page.getByRole("button", { name: /delete project/i }).click();
    await expectToast(page, /project deleted/i);
    await page.waitForURL("/projects", { timeout: 10_000 });
  });
});
