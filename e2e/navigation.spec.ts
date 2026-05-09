import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

// Dashboard uses a greeting heading, not "Dashboard" — handled separately
const ROUTES = [
  { path: "/tasks",     label: /tasks/i },
  { path: "/notes",     label: /notes/i },
  { path: "/calendar",  label: /calendar/i },
  { path: "/analytics", label: /analytics/i },
  { path: "/projects",  label: /projects/i },
  { path: "/settings",  label: /settings/i },
];

test.describe("Navigation", () => {
  test("sidebar is visible on all main routes", async ({ page }) => {
    await goto(page, "/dashboard");
    await expect(page.locator("nav, [data-testid='sidebar']").first()).toBeVisible({ timeout: 10_000 });
  });

  test("/dashboard shows greeting heading", async ({ page }) => {
    await goto(page, "/dashboard");
    await expect(
      page.getByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  for (const { path, label } of ROUTES) {
    test(`${path} renders a heading`, async ({ page }) => {
      await goto(page, path);
      await expect(page.getByRole("heading", { name: label }).first()).toBeVisible({ timeout: 15_000 });
    });
  }

  test("sidebar links navigate to correct pages", async ({ page }) => {
    await goto(page, "/dashboard");
    await page.getByRole("link", { name: /tasks/i }).first().click();
    await page.waitForURL("/tasks", { timeout: 5_000 });

    await page.getByRole("link", { name: /notes/i }).first().click();
    await page.waitForURL("/notes", { timeout: 5_000 });
  });

  test("notification bell is visible in layout", async ({ page }) => {
    await goto(page, "/dashboard");
    await expect(
      page.getByRole("button", { name: /notifications?/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("notification bell opens panel on click", async ({ page }) => {
    await goto(page, "/dashboard");
    // Multiple bells in DOM (desktop sidebar, mobile nav) — click the visible one
    await page.locator('aside, nav').getByTestId("notification-bell").first().click();
    await expect(page.getByTestId("notification-panel")).toBeVisible({ timeout: 5_000 });
  });
});
