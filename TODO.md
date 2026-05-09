# Productivity App — To Do

## Reliability
- [ ] **Error monitoring (Sentry)** — know when things break in production before users report it (free tier: 5k errors/month)
- [ ] **Error boundaries** — wrap major UI sections so crashes don't take down the whole app
- [ ] **API retry logic** — automatic retries for flaky network conditions on the client

## Performance
- [ ] **Bundle size audit** — run `next build` analyzer, lazy load any remaining heavy deps
- [ ] **HTTP caching headers** — add cache headers on the backend for static/slow-changing data
- [x] **Database indexing** — Prisma schema has composite indexes on all major tables (Task, Note, Project, Notification, etc.)

## Security
- [ ] **Content Security Policy headers** — add CSP headers on the server (helmet not installed)
- [ ] **Rate limiting** — magic link has a custom limiter (3/email/10min) but general API endpoints are unprotected
- [ ] **Dependency audit** — run `npm audit` and keep packages up to date

## Accessibility
- [ ] **Keyboard navigation audit** — ensure all interactive elements are reachable via keyboard
- [ ] **Screen reader support** — add missing ARIA labels throughout the app
- [ ] **Color contrast check** — verify all text meets WCAG AA contrast ratios

## DevOps
- [ ] **CI/CD pipeline** — run tests automatically on every push (GitHub Actions)
- [ ] **Staging environment** — separate env from production for safe testing
- [ ] **Automated deployments** — deploy on merge to main without manual steps

## Observability
- [ ] **Structured logging** — NestJS Logger is used but outputs plain text; switch to JSON format (pino or winston) for searchable logs
- [ ] **Uptime monitoring** — get alerted if the server goes down (e.g. Better Uptime, UptimeRobot — free)
