import { test, expect } from "@playwright/test";
import { goto, expectToast, selectAll } from "./helpers";

test.describe("Notes", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/notes");
  });

  test("page shows Notes header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^notes$/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("creates a note and lists Untitled Note", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);
    await expect(page.getByText("Untitled Note").first()).toBeVisible({ timeout: 10_000 });
  });

  test("edits note title and updates the list", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    const titleInput = page.locator('input[placeholder="Untitled"]').first();
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill("My Test Note");
    await titleInput.blur();

    await expect(page.getByText("My Test Note").first()).toBeVisible({ timeout: 8_000 });
  });

  test("rich text: bold via formatting toolbar", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    const editor = page.locator(".ProseMirror").first();
    await expect(editor).toBeVisible({ timeout: 15_000 });
    await editor.click();
    await editor.type("Hello bold");

    await selectAll(page);
    await page.waitForTimeout(200);

    await page.getByRole("button", { name: /bold \(⌘b\)/i }).first().click();

    await expect(editor.locator("strong, b")).toHaveText(/hello bold/i);
  });

  test("formatting toolbar is visible", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    await expect(page.getByTestId("editor-toolbar")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("toolbar", { name: /formatting/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /heading 1/i })).toBeVisible();
  });

  test("deletes a note from the list", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    const row = page.locator(".relative.group").filter({ has: page.getByTestId("note-card") }).first();
    const card = row.getByTestId("note-card").first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await row.hover();
    await page.waitForTimeout(200);

    await row.getByTitle("Delete note").click();
    await expectToast(page, /note deleted/i);
  });

  test("search filters by title", async ({ page }) => {
    const token = `E2E-${Date.now()}`;
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    const titleInput = page.locator('input[placeholder="Untitled"]').first();
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill(token);
    await titleInput.blur();
    await expect(page.getByText(token).first()).toBeVisible({ timeout: 8_000 });

    await page.getByLabel("Search notes").fill(token);
    await page.waitForTimeout(400);
    await expect(page.getByTestId("note-card").filter({ hasText: token })).toBeVisible();
  });
});

test.describe("Notes — convert to task", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/notes");
  });

  test("To task control is available for a new note", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    await expect(page.getByTestId("convert-to-task")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("convert-to-task")).toContainText(/to task/i);
  });

  test("convert to task succeeds and shows toast", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    const title = `Convert-${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Untitled"]').first();
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.clear();
    await titleInput.fill(title);
    await titleInput.blur();
    await page.waitForTimeout(800);

    await page.getByTestId("convert-to-task").click();
    await expectToast(page, /converted to task/i);
  });

  test("after conversion, To task is hidden and task link is shown", async ({ page }) => {
    await page.getByTitle("New note").click();
    await expectToast(page, /note created/i);

    await expect(page.getByTestId("convert-to-task")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("convert-to-task").click();
    await expectToast(page, /converted to task/i);

    await expect(page.getByTestId("convert-to-task")).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("link-chip-task")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /unlink task/i })).toBeVisible();
  });
});
