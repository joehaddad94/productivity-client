/**
 * Global setup — runs once before all tests.
 *
 * Calls POST /api/auth/dev-session (same-origin via Next proxy) to get a JWT cookie,
 * then saves the browser storage state so every test starts authenticated
 * with a test workspace ready.
 *
 * Set PLAYWRIGHT_BASE_URL for hosted runs (e.g. https://app.example.com).
 * Backend must allow /auth/dev-session (not available when API NODE_ENV=production).
 */
import { test as setup, expect, request } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PLAYWRIGHT_BASE_URL } from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

function parseFirstCookieNameValue(setCookie: string): { name: string; value: string } {
  const firstPart = setCookie.split(";")[0]?.trim() ?? "";
  const eq = firstPart.indexOf("=");
  if (eq <= 0) {
    throw new Error(`Invalid Set-Cookie (no name=value): ${setCookie.slice(0, 80)}`);
  }
  return {
    name: firstPart.slice(0, eq).trim(),
    value: firstPart.slice(eq + 1).trim(),
  };
}

setup("authenticate and prepare workspace", async ({ page }) => {
  const apiCtx = await request.newContext({ baseURL: PLAYWRIGHT_BASE_URL });
  const res = await apiCtx.post("/api/auth/dev-session", {
    data: { email: "playwright@tasky.test", name: "Playwright Test" },
  });

  if (res.status() === 403) {
    throw new Error(
      "E2E: POST /api/auth/dev-session returned 403. On production APIs dev-session is disabled; " +
        "use a staging/preview backend or run against local next dev + API with NODE_ENV!=production.",
    );
  }
  expect(res.status()).toBe(201);

  const setCookieHeader = res.headers()["set-cookie"];
  expect(setCookieHeader, "Backend must set auth cookie").toBeTruthy();
  const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const { name: cookieName, value: cookieValue } = parseFirstCookieNameValue(cookieStrings[0]!);

  await page.context().addCookies([
    {
      name: cookieName,
      value: cookieValue,
      url: PLAYWRIGHT_BASE_URL,
    },
  ]);

  await page.goto(`${PLAYWRIGHT_BASE_URL}/`);
  await page.waitForLoadState("load");

  const url = page.url();
  if (url.includes("/workspace")) {
    await page.fill('input[placeholder*="workspace" i], input[name="name"]', "Playwright Workspace");
    await page.click('button[type="submit"], button:has-text("Create")');
    await page.waitForURL(/\/(dashboard|notes|tasks)/, { timeout: 10_000 });
  }

  await page.waitForSelector('nav, [data-testid="sidebar"], [aria-label*="navigation" i]', {
    timeout: 15_000,
  });

  await page.waitForURL(/\/(dashboard|notes|tasks|analytics|settings|calendar)/, {
    timeout: 10_000,
  });

  await page.waitForFunction(
    () => {
      const body = document.body;
      if (body.dataset.workspaceReady === "true") return true;
      const main = document.querySelector('main, [role="main"], #__next main');
      return main !== null && main.children.length > 0;
    },
    { timeout: 15_000 },
  );

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  await apiCtx.dispose();
});
