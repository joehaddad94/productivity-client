# Productivity App — To Do

## Reliability
- [x] **Error monitoring (Sentry)** — know when things break in production before users report it (free tier: 5k errors/month)
- [x] **Error boundaries** — route-level (`error.tsx`) and root-level (`global-error.tsx`) boundaries in place; both capture to Sentry
- [ ] **API retry logic** — create shared `ApiError` class (with `status` field) + shared `apiFetch` helper; update all ~12 API files to use it; configure React Query `retry` to skip 4xx and retry 5xx/network errors up to 2x with exponential backoff; follow up with full E2E suite to confirm nothing broke

## Performance
- [x] **Bundle size audit** — lazy-loaded Tiptap (notes only) and Recharts (analytics only) with `next/dynamic`; removed unused `motion` package
- [~] **HTTP caching headers** — skipped; React Query `staleTime: 2min` already covers client-side caching; HTTP cache adds stale data risk with marginal benefit for a single-user app
- [x] **Database indexing** — Prisma schema has composite indexes on all major tables (Task, Note, Project, Notification, etc.)

## Security
- [ ] **Content Security Policy headers** — add CSP headers on the server (helmet not installed)
- [x] **Rate limiting** — global 100 req/min per IP via `@nestjs/throttler`; health check excluded; magic link custom limiter (3/email/10min) unchanged
- [~] **Dependency audit** — client: upgraded Next.js 16.2.6 (fixed high DoS); server: `npm audit fix` corrupts Prisma node_modules on Windows, skip for now; remaining issues are low real-world risk (OTel/dev-only deps)

## Accessibility
- [x] **Keyboard navigation audit** — NoteCard/notification rows → button; icon-only buttons → aria-label + type; Escape closes notification panel and pomodoro widget; mobile overlay gets Escape handler; heatmap cells → button; ColorPicker/PriorityToggle → focus-visible:ring + aria-pressed
- [x] **Screen reader support** — aria-label on all icon-only buttons; role="alert" on all error messages; role="progressbar" on today's progress bar; streak/activity dots get aria-label; decorative icons get aria-hidden; date/time inputs get aria-label; pomodoro task picker search labeled; session dots labeled
- [x] **Color contrast check** — fixed 3 failures: muted-foreground #71717a→#6d6d73 (was 4.39:1 on muted bg, now 4.68:1); medium priority badge amber-600→amber-700 (was 2.89:1, now 4.84:1); high priority badge red-600→red-700 (was 4.02:1, now 5.91:1); dark mode gets amber-400/red-400 for same badges

## DevOps
- [ ] **CI/CD pipeline** — run tests automatically on every push (GitHub Actions)
- [ ] **Staging environment** — separate env from production for safe testing
- [ ] **Automated deployments** — deploy on merge to main without manual steps

## Observability
- [~] **Structured logging** — skipped; Sentry already covers errors, performance, and searchable traces
- [~] **Uptime monitoring** — deferred to production deployment; health endpoint at GET /health is ready

## Marketing Site & Documentation
> Goal: same Next.js app, separate layout for public-facing pages. Target: individuals. Currently in closed beta.

### Routing plan
Use Next.js route groups to separate marketing from the app:
- `src/app/(marketing)/` — new layout: navbar + footer, no sidebar
- `src/app/(app)/` — existing layout: sidebar (dashboard, tasks, notes, etc.)

### Pages to build
- [ ] **`/` Landing page** — hero, feature highlights, CTA buttons
- [ ] **`/features` Features page** — breakdown of all major features
- [ ] **`/pricing` Pricing page** — placeholder "Free during beta" for now; real tiers TBD
- [ ] **`/docs` Docs** — feature guides; depth and structure TBD
- [ ] **`/changelog` Changelog** — static for now; update strategy TBD
- [ ] **FAQ** — optional, add if needed

### Marketing navbar behaviour
- User not logged in → show **Login** + **Get started** (→ `/register`)
- User logged in → show **Go to dashboard** (→ `/dashboard`)

### Design
- Match the existing app aesthetic (Linear/Notion style, Inter font, same CSS variables)
- No separate design needed — derive from existing design system

### In-app onboarding (phase 2)
- First-login onboarding modal: create workspace → add task → try pomodoro
- Richer empty states that guide new users
- `/help` page with keyboard shortcuts and feature overview

### Docs site (phase 3 — when going public)
- Mintlify connected to GitHub repo (reads markdown files)
- Or Notion public page for zero-maintenance option
