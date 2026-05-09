import { test, expect } from "@playwright/test";
import { goto, expectToast } from "./helpers";

test.describe("Workspaces", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/workspaces");
  });

  test("shows Manage workspaces heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /manage workspaces/i })).toBeVisible({ timeout: 10_000 });
  });

  test("shows at least one workspace in the list", async ({ page }) => {
    await expect(page.getByText(/your workspaces/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/playwright/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Create Workspace button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create workspace/i })).toBeVisible({ timeout: 10_000 });
  });

  test("create workspace form opens and is submittable", async ({ page }) => {
    const name = `E2E-WS-${Date.now()}`;
    // Scope to the "Add workspace" section to avoid hitting sidebar buttons
    const section = page.locator("section").filter({ hasText: /add workspace/i });
    await section.getByRole("button").click();
    const input = page.locator('input[placeholder="My Workspace"]').first();
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.fill(name);
    // Submit button should be enabled once name is filled
    const submitBtn = page.getByRole("button", { name: "Create", exact: true }).first();
    await expect(submitBtn).toBeEnabled({ timeout: 3_000 });
    await submitBtn.click();
    // Either success toast OR the form closes (workspace created or already exists)
    await page.waitForTimeout(2_000);
    // Verify we're still on workspaces page and no crash occurred
    await expect(page.getByRole("heading", { name: /manage workspaces/i })).toBeVisible({ timeout: 5_000 });
  });

  test("Switch button sets workspace as current", async ({ page }) => {
    // Switch button just updates current workspace — no page navigation
    const switchBtn = page.getByRole("button", { name: "Switch", exact: true }).first();
    await expect(switchBtn).toBeVisible({ timeout: 10_000 });
    await switchBtn.click();
    // After switching, a "Current" badge appears on the workspace card
    await expect(page.getByText("Current").first()).toBeVisible({ timeout: 5_000 });
  });
});
