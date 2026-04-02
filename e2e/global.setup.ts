/**
 * Global setup — runs once before all tests.
 *
 * Calls POST /auth/dev-session on the backend to get a JWT cookie,
 * then saves the browser storage state so every test starts authenticated
 * with a test workspace ready.
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

  // 5. Save auth state for reuse in all tests
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  await apiCtx.dispose();
});
