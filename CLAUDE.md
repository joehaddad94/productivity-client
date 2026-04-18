# CLAUDE.md — Agent Workflow Rules

## Repo layout
- **Client**: `C:\Users\Joe\Desktop\productivity-client` (Next.js, branch `agent`)
- **Server**: `C:\Users\Joe\Desktop\productivity-server` (NestJS, branch `agent`)

## Branch & PR rules (permit/notify flow)
1. All work goes on the **`agent`** branch of the respective repo.
2. When ready to push a completed feature:
   - `git add -A && git commit -m "<conventional commit message>"`
   - `git push origin agent`
   - Open a PR **agent → development** on GitHub via the API (title = commit subject).
3. **Never force-push.** Never push directly to `main` or `development`.
4. After opening the PR, update `C:\Users\Joe\.claude\projects\...\memory\progress.md`
   with the feature status and PR link.

## Test commands (run from client root)
```
# E2E (auth + notes only; requires Next + API)
npm run test:e2e
```

## Commit message convention
`feat(<scope>): <description>` / `fix(<scope>): <description>` / `chore(<scope>): <description>`

## Server module structure
`src/<feature>/<feature>.module.ts|controller.ts|service.ts|dto/`

## Current backlog (in priority order)
1. ~~Pomodoro per-task focus minutes~~ ✅
2. **Notifications & Reminders** (next — see below)
3. Recurring tasks
4. Team / workspace sharing

## Notifications & Reminders — spec
### Server (`productivity-server`, NestJS)
- Install `@nestjs/schedule` + `node-cron`; add `ScheduleModule.forRoot()` to `AppModule`
- `NotificationsModule` with:
  - `Notification` Prisma model: `id, userId, taskId?, title, body, type (DUE_SOON|OVERDUE|DAILY_AGENDA), read, createdAt`
  - Migration: `add_notifications_table`
  - `NotificationsService`:
    - `getUserNotifications(userId)` — list unread, newest first
    - `markRead(id, userId)` — mark single notification read
    - `markAllRead(userId)`
    - `createNotification(dto)` — internal
  - `NotificationsController`: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
  - `RemindersScheduler` (`@Injectable()`, uses `@Cron`):
    - Every minute (`@Cron('* * * * *')`): find tasks with `dueDate` within the next 60 min that haven't had a `DUE_SOON` notification yet today → create notification
    - Every minute: find tasks with `dueDate` < now and no `OVERDUE` notification today → create notification
    - Daily at 08:00 Beirut time (`@Cron('0 8 * * *', { timeZone: 'Asia/Beirut' })`): for each user with tasks due today → create `DAILY_AGENDA` notification summarising them

### Client (`productivity-client`, Next.js)
- `Notification` type + `notificationsApi` (GET, PATCH read, PATCH read-all)
- `useNotificationsQuery` + `useMarkReadMutation` + `useMarkAllReadMutation` hooks
- **Bell icon** in top-right header (next to user avatar):
  - Badge with unread count (hidden when 0)
  - Clicking opens a dropdown panel listing notifications
  - Each row: icon (🔔 due soon / ⚠️ overdue / 📅 agenda), title, relative time, mark-read on click
  - "Mark all read" button at top of panel
  - Empty state: "You're all caught up 🎉"
- Poll every 60 s with `refetchInterval`
- **Settings page**: replace "Notifications coming soon" placeholder with a real toggle section:
  - Due-soon alerts (on/off) — stored in user preferences (`PATCH /auth/me`)
  - Overdue alerts (on/off)
  - Daily agenda (on/off)
  - Preference fields: `notifyDueSoon: boolean`, `notifyOverdue: boolean`, `notifyDailyAgenda: boolean` — add to `UpdateUserDto` + Prisma `User` model (migration: `add_notification_prefs`)

### Tests
- Server: unit test `RemindersScheduler` with mocked `PrismaService` and mocked `Date`
- Client e2e: `e2e/notifications.spec.ts`
  - Bell icon is visible in header
  - Clicking bell opens dropdown
  - Unread badge disappears after "Mark all read"
  - Settings page shows notification toggles
