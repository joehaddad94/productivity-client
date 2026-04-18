import { test, expect } from "@playwright/test";
import { PLAYWRIGHT_BASE_URL } from "./env";

/** Unauthenticated flows — override saved session from global setup. */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login", () => {
  test("shows magic-link form", async ({ page }) => {
    await page.goto(`${PLAYWRIGHT_BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send sign-in link/i })).toBeVisible();
  });

  test("navigates to sign up from login", async ({ page }) => {
    await page.goto(`${PLAYWRIGHT_BASE_URL}/login`);
    await page.getByRole("link", { name: /sign up/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });
});

test.describe("Sign up", () => {
  test("shows registration form", async ({ page }) => {
    await page.goto(`${PLAYWRIGHT_BASE_URL}/signup`);
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("navigates to login from sign up", async ({ page }) => {
    await page.goto(`${PLAYWRIGHT_BASE_URL}/signup`);
    await page.getByRole("link", { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});

test.describe("Auth guard", () => {
  test("redirects unauthenticated users away from notes", async ({ page }) => {
    await page.goto(`${PLAYWRIGHT_BASE_URL}/notes`);
    await expect(page).toHaveURL(/login|signin/i, { timeout: 10_000 });
  });
});
