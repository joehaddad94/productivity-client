import { test, expect } from "@playwright/test";
import { mockApi } from "./mock-api";

/**
 * Notes gallery behaviour, against a mocked API.
 *
 * These cover regressions that the live specs cannot: they need a slow or
 * precisely-timed server, or real keyboard traversal, and they must not write
 * to the database. No backend or auth session is required.
 */

const NOTES_URL = "/notes";

test.describe("Notes gallery (mocked API)", () => {
  test("creating a note opens the focused editor and keeps it open", async ({ page }) => {
    // A slow create widens the window between the optimistic temp id and the
    // real note landing. A guard that keyed off the resolved note instead of
    // the selected id closed the editor in that window and never reopened it.
    await mockApi(page, { createDelayMs: 700 });
    await page.goto(NOTES_URL);
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });

    await page.getByTitle("New note").click();

    const title = page.locator('input[placeholder="Untitled"]');
    await expect(title).toBeVisible({ timeout: 10_000 });
    await expect(title).toHaveValue("Untitled Note");

    // Survives the optimistic -> real id swap once the server responds.
    await page.waitForTimeout(2_000);
    await expect(title).toBeVisible();
    await expect(title).toHaveValue("Untitled Note");
  });

  test("editor traps focus and restores it on close", async ({ page }) => {
    await mockApi(page);
    await page.goto(NOTES_URL);

    const card = page.getByTestId("note-card").first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.click();
    await expect(page.locator('input[placeholder="Untitled"]')).toBeVisible({ timeout: 15_000 });

    const focusInsideDialog = () =>
      page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return !!(dialog && document.activeElement && dialog.contains(document.activeElement));
      });

    expect(await focusInsideDialog()).toBe(true);

    // Tab must not walk out into the gallery rendered behind the dialog.
    for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
    expect(await focusInsideDialog()).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator('input[placeholder="Untitled"]')).toBeHidden({ timeout: 5_000 });

    // Focus returns to the page, not lost on <body>.
    const restored = await page.evaluate(
      () => document.activeElement !== null && document.activeElement !== document.body,
    );
    expect(restored).toBe(true);
  });

  test("Escape and the Close button both dismiss the editor", async ({ page }) => {
    await mockApi(page);
    await page.goto(NOTES_URL);
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });

    const title = page.locator('input[placeholder="Untitled"]');

    await page.getByTestId("note-card").first().click();
    await expect(title).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(title).toBeHidden();

    await page.getByTestId("note-card").first().click();
    await expect(title).toBeVisible();
    const close = page.getByRole("button", { name: /^close$/i });
    await expect(close).toHaveCount(1);
    await close.click();
    await expect(title).toBeHidden();
  });

  test("grid/list toggle switches view and persists across reload", async ({ page }) => {
    await mockApi(page);
    await page.goto(NOTES_URL);
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("List view").click();
    await expect(page.getByLabel("List view")).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("List view")).toHaveAttribute("aria-pressed", "true");

    await page.getByLabel("Grid view").click();
    await expect(page.getByLabel("Grid view")).toHaveAttribute("aria-pressed", "true");
  });

  test("mobile drawer does not duplicate selectors", async ({ page }) => {
    // The drawer mounts a second rail while the desktop one is still in the
    // DOM; only the primary instance may carry test ids.
    await page.setViewportSize({ width: 402, height: 860 });
    await mockApi(page);
    await page.goto(NOTES_URL);
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("tag-filter-bar")).toHaveCount(1);
    await expect(page.getByTitle("New note")).toHaveCount(1);

    await page.getByLabel("Open filters").click();
    await expect(page.getByRole("heading", { name: /^notes$/i })).toBeVisible();

    await expect(page.getByTestId("tag-filter-bar")).toHaveCount(1);
    await expect(page.getByTestId("tag-filter-manage")).toHaveCount(1);
    await expect(page.getByLabel("Create note")).toHaveCount(1);
    await expect(page.getByTitle("New note")).toHaveCount(1);
  });

  test("image-only notes render a thumbnail rather than a blank card", async ({ page }) => {
    await mockApi(page);
    await page.goto(NOTES_URL);
    await expect(page.getByTestId("note-card").first()).toBeVisible({ timeout: 30_000 });

    // Seed note 3 has no text and no image: it must say so rather than be blank.
    await expect(
      page.getByTestId("note-card").filter({ hasText: "Empty one" }),
    ).toContainText(/empty note/i);
  });
});
