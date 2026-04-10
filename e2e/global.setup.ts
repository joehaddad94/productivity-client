/**
 * Global setup — runs once before all tests.
 *
 * Calls POST /auth/dev-session on the backend to get a JWT cookie,
 * then saves the browser storage state so every test starts authenticated
 * with a test workspace ready.
 *
 * FIX: After navigating to '/' we must wait for the workspace context to
 * finish loading (sidebar nav becomes visible) before saving state.
 * Without this wait, tests that rely on workspace data (Notes "New" button,
 * Pomodoro expanded panel, etc.) fail with 30s timeouts because the context
 * provider hasn't resolved yet when the auth state snapshot is taken.
 */
import { test as setup, expect, request } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = 'http://localhost:8000';
const AUTH_FILE = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate and prepare workspace', async ({ page }) => {
  // 1. Get a session cookie from the backend dev endpoint
  const apiCtx = await request.newContext({ baseURL: API });
  const res = await apiCtx.post('/auth/dev-session', {
    data: { email: 'playwright@tasky.test', name: 'Playwright Test' },
  });
  expect(res.status()).toBe(201);

  // 2. Extract the Set-Cookie header and inject it into the browser context
  const setCookie = res.headers()['set-cookie'];
  expect(setCookie, 'Backend must set auth cookie').toBeTruthy();

  // Parse cookie name/value/domain for Playwright
  const cookieParts = setCookie.split(';').map((s) => s.trim());
  const [nameVal] = cookieParts;
  const [cookieName, cookieValue] = nameVal.split('=');

  await page.context().addCookies([
    {
      name: cookieName.trim(),
      value: cookieValue.trim(),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // 3. Navigate to the app — should land on dashboard or workspace gate
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // 4. Create a test workspace if none exists
  const url = page.url();
  if (url.includes('/workspace')) {
    // On workspace creation gate — create one
    await page.fill('input[placeholder*="workspace" i], input[name="name"]', 'Playwright Workspace');
    await page.click('button[type="submit"], button:has-text("Create")');
    await page.waitForURL(/\/(dashboard|notes|tasks)/, { timeout: 10_000 });
  }

  // 5. ── CRITICAL FIX ──────────────────────────────────────────────────────
  //    Wait for the workspace context to fully initialize before saving state.
  //    The WorkspaceProvider fetches workspace data asynchronously; if we
  //    snapshot too early, every test starts with an un-initialized context
  //    and content-dependent UI (Notes "New" button, Pomodoro panel, etc.)
  //    never appears — causing 30s timeouts across all feature specs.
  //
  //    We wait for the sidebar navigation to be visible: it is only rendered
  //    once WorkspaceContext has resolved with a valid workspace object.
  // ────────────────────────────────────────────────────────────────────────
  await page.waitForSelector('nav, [data-testid="sidebar"], [aria-label*="navigation" i]', {
    timeout: 15_000,
  });

  // Also ensure we're on a real app route (not still on workspace gate)
  await page.waitForURL(/\/(dashboard|notes|tasks|analytics|settings|calendar)/, {
    timeout: 10_000,
  });

  // Give the workspace context one extra tick to settle all async state
  // (e.g. active workspace ID written to context, project list fetched)
  await page.waitForFunction(
    () => {
      // The app sets data-workspace-ready="true" on <body> once context resolves,
      // OR we fall back to checking that the main content area has children.
      const body = document.body;
      if (body.dataset.workspaceReady === 'true') return true;
      const main = document.querySelector('main, [role="main"], #__next main');
      return main !== null && main.children.length > 0;
    },
    { timeout: 15_000 },
  );

  // 6. Save auth state for reuse in all tests
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  await apiCtx.dispose();
});
