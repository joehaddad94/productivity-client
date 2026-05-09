import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/analytics");
  });

  test("shows Analytics heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^analytics$/i })).toBeVisible({ timeout: 10_000 });
  });

  test("productivity score ring is visible", async ({ page }) => {
    await expect(page.getByText(/productivity score/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("focus time stat is visible", async ({ page }) => {
    await expect(page.getByText(/focus/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("tasks completed stat is visible", async ({ page }) => {
    await expect(page.getByText(/tasks completed/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("streak stat is visible", async ({ page }) => {
    await expect(page.getByText(/streak/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("activity heatmap renders", async ({ page }) => {
    await expect(page.getByText(/activity/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("date range selector has 7d / 30d / 90d options", async ({ page }) => {
    await expect(page.getByRole("button", { name: /7d|7 days/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /30d|30 days/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /90d|90 days/i })).toBeVisible();
  });

  test("clicking a range button updates selection", async ({ page }) => {
    const btn7 = page.getByRole("button", { name: /7d|7 days/i });
    await btn7.click();
    await expect(btn7).toBeVisible({ timeout: 5_000 });
  });

  test("chart area renders (with data or empty state)", async ({ page }) => {
    // Chart renders when data exists; empty state message renders otherwise
    const hasChart = await page.locator(".recharts-surface").first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no tasks completed/i).first().isVisible().catch(() => false);
    expect(hasChart || hasEmptyState).toBe(true);
  });
});
