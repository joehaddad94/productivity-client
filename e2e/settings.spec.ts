import { test, expect } from "@playwright/test";
import { goto, expectToast } from "./helpers";

test.describe("Settings — Profile", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
  });

  test("shows Settings heading and Profile tab active by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^settings$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /profile/i }).first()).toBeVisible();
  });

  test("displays user name and email fields", async ({ page }) => {
    await expect(page.getByLabel(/display name|name/i).first()).toBeVisible({ timeout: 10_000 });
    // Email is shown as a disabled input, not associated via label — locate by type
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test("can update display name and shows toast", async ({ page }) => {
    const nameInput = page.getByLabel(/display name|name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    // Use unique name so the form is always dirty (Save button enabled)
    await nameInput.clear();
    await nameInput.fill(`Test User ${Date.now()}`);
    const saveBtn = page.getByRole("button", { name: "Save changes", exact: true });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();
    await expectToast(page, /saved|updated|profile/i);
  });
});

test.describe("Settings — Appearance", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
    await page.getByRole("button", { name: /appearance/i }).click();
  });

  test("shows theme options: Light, Dark, System", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^light$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /^dark$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^system$/i })).toBeVisible();
  });

  test("clicking Dark applies dark class to html element", async ({ page }) => {
    await page.getByRole("button", { name: /^dark$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });
  });

  test("clicking Light removes dark class", async ({ page }) => {
    await page.getByRole("button", { name: /^dark$/i }).click();
    await page.getByRole("button", { name: /^light$/i }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/, { timeout: 5_000 });
  });
});

test.describe("Settings — Calendars", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
    await page.getByRole("button", { name: /calendars/i }).click();
  });

  test("shows Google Calendar and Microsoft Calendar cards", async ({ page }) => {
    await expect(page.getByText(/google calendar/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/microsoft calendar/i)).toBeVisible();
  });

  test("Connect buttons are enabled", async ({ page }) => {
    const connectBtns = page.getByRole("button", { name: /^connect$/i });
    const count = await connectBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      await expect(connectBtns.nth(i)).toBeEnabled({ timeout: 5_000 });
    }
  });
});

test.describe("Settings — Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
    // Scope to settings tab nav to avoid matching the notification bell button
    await page.locator('main, [role="main"]').getByText("Notifications", { exact: true }).click();
  });

  test("shows notification toggle switches", async ({ page }) => {
    await expect(page.getByRole("switch").first()).toBeVisible({ timeout: 10_000 });
  });

  test("toggling a switch doesn't crash", async ({ page }) => {
    const toggle = page.getByRole("switch").first();
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    await toggle.click();
    // No crash = page still functional after toggle
    await page.waitForTimeout(500);
    await expect(toggle).toBeVisible();
    // Restore
    await toggle.click();
  });
});
