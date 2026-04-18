/**
 * E2E environment — works locally and against a hosted app (Vercel + proxied API).
 *
 * - PLAYWRIGHT_BASE_URL — frontend origin (default http://localhost:3000)
 * - Dev session: POST {BASE}/api/auth/dev-session (Next `/api` → backend). Requires
 *   a non-production API where /auth/dev-session is enabled.
 */
export const PLAYWRIGHT_BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** Same-origin API base for cookie-authenticated `page.request` calls (Next rewrite). */
export const API = `${PLAYWRIGHT_BASE_URL}/api`;
