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
- [ ] **Color contrast check** — verify all text meets WCAG AA contrast ratios

## DevOps
- [ ] **CI/CD pipeline** — run tests automatically on every push (GitHub Actions)
- [ ] **Staging environment** — separate env from production for safe testing
- [ ] **Automated deployments** — deploy on merge to main without manual steps

## Observability
- [ ] **Structured logging** — NestJS Logger is used but outputs plain text; switch to JSON format (pino or winston) for searchable logs
- [ ] **Uptime monitoring** — get alerted if the server goes down (e.g. Better Uptime, UptimeRobot — free)
