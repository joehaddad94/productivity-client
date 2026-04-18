/**
 * Standalone WebKit / Safari repro for the "Mac users bounce back to /login
 * after clicking a magic link" bug.
 *
 * How it works:
 *   1. Creates a throwaway inbox via mail.tm's public API.
 *   2. Registers that email against the hosted backend.
 *   3. Polls mail.tm for the magic-link email, extracts ?token=...
 *   4. Navigates WebKit (Safari's engine) to the hosted frontend's /verify
 *      page with a Mac Safari User-Agent + Mac locale/timezone + fresh cookie jar.
 *   5. Logs every /auth/* request and response (status, Set-Cookie headers,
 *      CORS headers, body preview), cookies before & after, final URL, and
 *      saves a Playwright trace + screenshot for replay.
 *
 * This script does NOT use the Playwright test runner and does NOT touch
 * playwright/.auth/user.json, so it can safely run alongside the main e2e
 * suite run by another agent.
 *
 * Run:   node scripts/webkit-mac-repro.mjs
 * Trace: npx playwright show-trace scripts/webkit-mac-repro.zip
 */

import { webkit } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

// Override via env for re-runs (e.g. after deploying the /api rewrite):
//   FRONTEND_URL=https://<preview>.vercel.app \
//   BACKEND_URL=https://<preview>.vercel.app/api \
//   node scripts/webkit-mac-repro.mjs
const FRONTEND = process.env.FRONTEND_URL || "https://productivity-client.vercel.app";
const BACKEND =
  process.env.BACKEND_URL || "https://productivity-server-development.up.railway.app";
const MAIL_TM = "https://api.mail.tm";

const ts = Date.now();

const MAC_SAFARI_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15";

const OUT_DIR = "scripts";
const TRACE_PATH = `${OUT_DIR}/webkit-mac-repro.zip`;
const SCREENSHOT_PATH = `${OUT_DIR}/webkit-mac-repro.png`;

function log(...args) {
  const t = new Date().toISOString().slice(11, 23);
  console.log(`[${t}]`, ...args);
}

async function mailTmCreateInbox() {
  const domRes = await fetch(`${MAIL_TM}/domains`);
  if (!domRes.ok) throw new Error(`mail.tm /domains failed: ${domRes.status}`);
  const domJson = await domRes.json();
  const domain = domJson["hydra:member"]?.[0]?.domain;
  if (!domain) throw new Error("mail.tm: no domains available");

  const local = `tasky-mac-${ts}-${randomBytes(3).toString("hex")}`;
  const address = `${local}@${domain}`;
  const password = randomBytes(16).toString("hex");

  const acctRes = await fetch(`${MAIL_TM}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!acctRes.ok) {
    throw new Error(`mail.tm /accounts failed: ${acctRes.status} ${await acctRes.text()}`);
  }

  const tokRes = await fetch(`${MAIL_TM}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!tokRes.ok) {
    throw new Error(`mail.tm /token failed: ${tokRes.status} ${await tokRes.text()}`);
  }
  const { token } = await tokRes.json();
  return { address, token };
}

async function pollMailTm(token, { timeoutMs = 120_000, intervalMs = 3_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  const authHeaders = { Authorization: `Bearer ${token}` };
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    const listRes = await fetch(`${MAIL_TM}/messages`, { headers: authHeaders });
    if (listRes.ok) {
      const json = await listRes.json();
      const messages = json["hydra:member"] ?? [];
      if (messages.length > 0) {
        log(`mail.tm: got ${messages.length} message(s) on attempt ${attempt}`);
        const msgId = messages[0].id;
        const msgRes = await fetch(`${MAIL_TM}/messages/${msgId}`, { headers: authHeaders });
        if (!msgRes.ok) {
          throw new Error(`mail.tm /messages/:id failed: ${msgRes.status}`);
        }
        const msg = await msgRes.json();
        const body =
          (Array.isArray(msg.html) ? msg.html.join("\n") : msg.html ?? "") +
          "\n\n---TEXT---\n" +
          (msg.text ?? "");
        return body;
      }
    } else {
      log(`mail.tm poll ${attempt}: HTTP ${listRes.status}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for magic-link email`);
}

function extractToken(emailBody) {
  const m = emailBody.match(/[?&]token=([^\s"'<>&]+)/);
  if (!m) {
    throw new Error(
      "Could not find ?token=... in email body. First 1000 chars:\n" +
        emailBody.slice(0, 1000)
    );
  }
  return decodeURIComponent(m[1]);
}

async function main() {
  await mkdir(dirname(TRACE_PATH), { recursive: true });

  log(`Frontend:  ${FRONTEND}`);
  log(`Backend:   ${BACKEND}`);

  log("Creating throwaway mail.tm inbox...");
  const { address: TEST_EMAIL, token: mailToken } = await mailTmCreateInbox();
  log(`Test email: ${TEST_EMAIL}`);

  log("Registering user via POST /auth/register ...");
  const regRes = await fetch(`${BACKEND}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND,
      "User-Agent": MAC_SAFARI_UA,
    },
    body: JSON.stringify({ email: TEST_EMAIL, name: "Mac Repro" }),
  });
  const regJson = await regRes.json().catch(() => ({}));
  log(`Register → ${regRes.status}`, regJson);

  if (regRes.status === 409) {
    log("User already exists — falling back to POST /auth/login");
    const loginRes = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: FRONTEND,
        "User-Agent": MAC_SAFARI_UA,
      },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    log(`Login → ${loginRes.status}`, loginJson);
    if (!loginRes.ok) throw new Error("Login failed");
  } else if (!regRes.ok) {
    throw new Error(`Register failed: ${regRes.status}`);
  }

  log("Polling mail.tm for magic-link email (up to 120s)...");
  const emailBody = await pollMailTm(mailToken);
  log("Email body (first 600 chars):\n" + emailBody.slice(0, 600));

  const token = extractToken(emailBody);
  log(`Extracted token: ${token.slice(0, 24)}... (len=${token.length})`);

  const verifyUrl = `${FRONTEND}/verify?token=${encodeURIComponent(token)}`;
  log(`Will navigate WebKit to: ${verifyUrl}`);

  log("Launching WebKit (Safari engine)...");
  const browser = await webkit.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({
    userAgent: MAC_SAFARI_UA,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const page = await context.newPage();

  page.on("request", (req) => {
    const url = req.url();
    if (/\/auth\//.test(url)) {
      log(`→ ${req.method()} ${url}`);
      const h = req.headers();
      if (h["cookie"]) log(`   req Cookie: ${h["cookie"]}`);
      if (h["origin"]) log(`   req Origin: ${h["origin"]}`);
      if (h["referer"]) log(`   req Referer: ${h["referer"]}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (/\/auth\//.test(url)) {
      log(`← ${res.status()} ${res.request().method()} ${url}`);
      const h = res.headers();
      const interesting = [
        "set-cookie",
        "access-control-allow-origin",
        "access-control-allow-credentials",
        "access-control-allow-methods",
        "access-control-allow-headers",
        "location",
        "content-type",
      ];
      for (const k of interesting) {
        if (h[k]) log(`   ${k}: ${h[k]}`);
      }
      try {
        const txt = await res.text();
        if (txt) log(`   body: ${txt.slice(0, 300).replace(/\s+/g, " ")}`);
      } catch {
        // Opaque / redirect response bodies can't always be read.
      }
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (/\/auth\//.test(url) || /productivity-client|productivity-server/.test(url)) {
      log(`✗ FAILED ${req.method()} ${url} — ${req.failure()?.errorText}`);
    }
  });

  page.on("console", (msg) => {
    log(`[browser ${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    log(`[browser pageerror] ${err.message}`);
  });

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      log(`[nav] ${frame.url()}`);
    }
  });

  log("Cookies BEFORE verify:", await context.cookies());

  await page.goto(verifyUrl, { waitUntil: "load" });

  log("Waiting 6s for verify fetch + client-side redirects to settle...");
  await page.waitForTimeout(6_000);

  log("Final URL:", page.url());
  log("Cookies AFTER verify:", await context.cookies());

  try {
    const meRes = await context.request.get(`${BACKEND}/auth/me`, {
      headers: { Origin: FRONTEND },
    });
    log(`Manual /auth/me from WebKit context → ${meRes.status()}`);
    log(`   body: ${(await meRes.text()).slice(0, 300)}`);
  } catch (e) {
    log("Manual /auth/me failed:", e.message);
  }

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  log(`Screenshot saved: ${SCREENSHOT_PATH}`);

  await context.tracing.stop({ path: TRACE_PATH });
  log(`Trace saved: ${TRACE_PATH}`);
  log(`Replay with: npx playwright show-trace ${TRACE_PATH}`);

  await context.close();
  await browser.close();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
