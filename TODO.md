# Productivity App — To Do

## Reliability
- [x] **Error monitoring (Sentry)** — client + server; route and root error boundaries; captures to Sentry
- [x] **Error boundaries** — route-level (`error.tsx`) and root-level (`global-error.tsx`)
- [ ] **API retry logic** — shared `ApiError` class + `apiFetch` helper; React Query retry: skip 4xx, retry 5xx/network up to 2× with exponential backoff

## Performance
- [x] **Bundle size audit** — lazy-loaded Tiptap and Recharts with `next/dynamic`; removed unused `motion`
- [x] **Database indexing** — composite indexes on Task, Note, Project, Notification tables
- [x] **Focus time logging speed** — was 4–5s; cut to ~500ms by replacing heavy `findOne` with lightweight existence check and parallelising the two DB writes
- [x] **Task reorder (drag-and-drop)** — was crashing with 500 on large lists (transaction timeout); replaced N sequential updates with a single `UPDATE CASE WHEN` query (~580ms for 32 tasks)
- [x] **Tasks page load** — eliminated a separate `/projects` request by embedding `project {id, name}` in each task response; project names on rows no longer require a second round-trip
- [~] **HTTP caching headers** — skipped; React Query `staleTime` already covers client-side caching adequately
- [~] **Members request on tasks page** — deferred; members finish loading 1s before tasks anyway so no gain in deferring

## Security
- [ ] **Content Security Policy headers** — helmet not installed on server
- [x] **Rate limiting** — global 100 req/min per IP via `@nestjs/throttler`; health excluded; magic link has its own limiter (3/email/10min)
- [~] **Dependency audit** — Next.js upgraded to 16.2.6; server `npm audit fix` corrupts Prisma on Windows; remaining issues are low-risk dev-only deps

## Accessibility
- [x] **Keyboard navigation** — all interactive elements reachable; Escape closes panels/widgets
- [x] **Screen reader support** — aria-labels, roles, and aria-hidden throughout
- [x] **Color contrast** — 3 WCAG failures fixed (muted-foreground, medium/high priority badges)

## UX Fixes
- [x] **Optimistic focus time logging** — counter updates instantly in the drawer; rolls back on error
- [x] **Pending task rows** — tasks created via quick-add are dimmed with a spinner while saving; all interactions disabled until the real ID arrives from the server
- [x] **Bulk delete confirmation** — now asks "Delete N tasks?" before proceeding, same as single task delete
- [x] **Task title input** — enlarged in the right panel for easier editing

## DevOps
- [ ] **CI/CD pipeline** — GitHub Actions: run tests on every push
- [ ] **Staging environment** — separate environment from production
- [ ] **Automated deployments** — deploy on merge to main

## Observability
- [x] **Grafana / OpenTelemetry** — traces and metrics flowing to Grafana Cloud; `npm run otel:test-export` to verify pipeline; `npm run grafana:check-data` to query live metrics
- [~] **Structured logging** — skipped; Sentry covers errors and traces
- [~] **Uptime monitoring** — deferred to production; `GET /health` endpoint is ready

## Marketing Site
> Same Next.js app, separate layout for public-facing pages. Currently in closed beta.

### Routing
- `src/app/(marketing)/` — navbar + footer, no sidebar
- `src/app/(app)/` — existing sidebar layout (unchanged)

### Pages to build
- [ ] `/` Landing page — hero, feature highlights, CTA
- [ ] `/features` — breakdown of all major features
- [ ] `/pricing` — "Free during beta" placeholder
- [ ] `/docs` — feature guides
- [ ] `/changelog` — static for now

### In-app onboarding (phase 2)
- [ ] First-login modal: create workspace → add task → try Pomodoro
- [ ] Richer empty states guiding new users
- [ ] `/help` page with keyboard shortcuts
