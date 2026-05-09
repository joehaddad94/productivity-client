import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

/** The Pomodoro widget is a fixed pill in the bottom-right corner, always visible. */
async function expandPomodoro(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Toggle timer" }).click();
  // Wait for expanded panel to appear
  await page.waitForTimeout(300);
}

test.describe("Pomodoro", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/dashboard");
  });

  test("Pomodoro pill is visible (shows session label and timer)", async ({ page }) => {
    // Collapsed pill always shows the session label ("Focus") and timer
    await expect(page.getByRole("button", { name: "Toggle timer" })).toBeVisible({ timeout: 10_000 });
  });

  test("shows timer display (MM:SS format)", async ({ page }) => {
    await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Start button is present and clickable", async ({ page }) => {
    const startBtn = page.getByRole("button", { name: "Start" });
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await startBtn.click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible({ timeout: 5_000 });
    // Restore
    await page.getByRole("button", { name: "Pause" }).click();
  });

  test("Pause stops the timer countdown", async ({ page }) => {
    await page.getByRole("button", { name: "Start" }).click();
    const timer = page.getByText(/\d{2}:\d{2}/).first();
    await page.getByRole("button", { name: "Pause" }).click();
    const before = await timer.textContent();
    await page.waitForTimeout(1_500);
    const after = await timer.textContent();
    expect(after).toBe(before);
  });

  test("Reset button restores timer (expanded panel)", async ({ page }) => {
    await expandPomodoro(page);
    const initial = await page.getByText(/\d{2}:\d{2}/).first().textContent();
    // Two Start buttons exist when expanded (pill + panel) — use the large panel one (size-[60px])
    await page.locator('button[aria-label="Start"].size-\\[60px\\]').click();
    await page.waitForTimeout(1_500);
    await page.getByRole("button", { name: "Reset" }).click();
    const restored = await page.getByText(/\d{2}:\d{2}/).first().textContent();
    expect(restored).toBe(initial);
  });

  test("session type labels exist in expanded panel", async ({ page }) => {
    await expandPomodoro(page);
    // The expanded panel shows the current session label
    await expect(page.getByText(/focus|short break|long break/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("Skip button is present in expanded panel", async ({ page }) => {
    await expandPomodoro(page);
    await expect(page.getByRole("button", { name: /skip/i })).toBeVisible({ timeout: 5_000 });
  });
});
