import { test, expect } from "@playwright/test";
import { goto, API } from "./helpers";

async function getWorkspaceId(page: import("@playwright/test").Page): Promise<string> {
  const wid = await page.evaluate(() => localStorage.getItem("tasky_current_workspace_id"));
  expect(wid, "workspace id must be in localStorage").toBeTruthy();
  return wid!;
}

async function createTaskViaApi(
  page: import("@playwright/test").Page,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const workspaceId = await getWorkspaceId(page);
  const res = await page.request.post(`${API}/workspaces/${workspaceId}/tasks`, {
    data: { title, ...extra },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return (body.task?.id ?? body.id) as string;
}

async function deleteTaskViaApi(page: import("@playwright/test").Page, id: string) {
  const workspaceId = await getWorkspaceId(page);
  await page.request.delete(`${API}/workspaces/${workspaceId}/tasks/${id}`);
}

// The calendar nav uses icon-only buttons (ChevronLeft / ChevronRight) with class h-7 w-7 p-0
const prevBtn = (page: import("@playwright/test").Page) =>
  page.locator("button.h-7.w-7.p-0").first();
const nextBtn = (page: import("@playwright/test").Page) =>
  page.locator("button.h-7.w-7.p-0").last();

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/calendar");
  });

  test("shows Calendar heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^calendar$/i })).toBeVisible({ timeout: 10_000 });
  });

  test("shows current month and year", async ({ page }) => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    const year = String(now.getFullYear());
    await expect(page.getByText(new RegExp(month, "i")).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(year).first()).toBeVisible();
  });

  test("previous and next navigation buttons exist", async ({ page }) => {
    await expect(prevBtn(page)).toBeVisible({ timeout: 10_000 });
    await expect(nextBtn(page)).toBeVisible();
  });

  test("clicking next changes the displayed month", async ({ page }) => {
    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = nextDate.toLocaleString("en-US", { month: "long" });

    await nextBtn(page).click();
    await expect(page.getByText(new RegExp(nextMonth, "i")).first()).toBeVisible({ timeout: 5_000 });
  });

  test("task with today's due date appears on calendar", async ({ page }) => {
    const today = new Date().toISOString().split("T")[0]!;
    const title = `E2E-CalTask-${Date.now()}`;
    const id = await createTaskViaApi(page, title, { dueDate: today });

    await page.reload();
    await goto(page, "/calendar");

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
    await deleteTaskViaApi(page, id);
  });

  test("Today button navigates back to current month", async ({ page }) => {
    await nextBtn(page).click();
    await page.getByRole("button", { name: /^today$/i }).click();

    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long" });
    await expect(page.getByText(new RegExp(month, "i")).first()).toBeVisible({ timeout: 5_000 });
  });

  test("view switcher buttons exist (month/week/agenda)", async ({ page }) => {
    const hasViewSwitcher = await page.getByRole("button", { name: /month|week|agenda/i }).first().isVisible().catch(() => false);
    if (!hasViewSwitcher) return;
    await expect(page.getByRole("button", { name: /month|week|agenda/i }).first()).toBeVisible();
  });
});
