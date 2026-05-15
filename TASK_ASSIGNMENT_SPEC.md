# Task Assignment Feature Spec

## Overview
Add workspace-scoped task assignment with role-based visibility, comments, activity logging, and team analytics. Built on a separate branch, deployed in one release.

---

## Roles

| Role | Appointed by | Can assign tasks | Can manage members | Controls visibility toggle |
|---|---|---|---|---|
| `owner` | Created the workspace | Yes | Yes | Yes |
| `admin` | Owner | Yes | No | No |
| `member` | Default on invite | No | No | No |

**Rules:**
- One owner per workspace
- Admins are optional — a workspace with only owner + members is valid
- Owner can promote members to admin and demote admins back to member
- Owner and admins can assign tasks to anyone in the workspace including each other
- No self-assignment
- Only owner can delete the workspace or remove members

---

## Visibility Rules

| Role | Sees |
|---|---|
| Owner / Admin | Their own created tasks + tasks they assigned to others |
| Member (`canSeeAllTasks: false`) | Their own created tasks + tasks assigned to them |
| Member (`canSeeAllTasks: true`) | All workspace tasks |

**Notes:**
- `canSeeAllTasks` is controlled per-member by the owner only
- Default: `false` for new members, `true` for existing members (migration)
- Unassigned tasks are visible only to the owner/admin who created them
- Members have a private space — owner cannot see tasks members created for themselves unless `canSeeAllTasks` is true

---

## Project Visibility for Members

- Projects are workspace-scoped — no project-level membership at this stage
- When a task belongs to a project, the project name shows as a **read-only label** on the task card for the assignee
- Member cannot navigate into the project
- Member only sees project tasks that are explicitly assigned to them
- Architecture is designed to be extensible to project-scoped membership later without a rewrite

---

## Assignment Rules

- Multiple assignees per task
- Only owner and admins can assign
- Subtasks **inherit** the parent task's assignees automatically on creation
- Assignees can be added or removed at any time by owner/admin
- Removing all assignees from a task makes it visible only to the owner/admin again

---

## Member Removal

When a member is removed from a workspace:
- **Tasks assigned to them** → unassigned (stay visible to owner/admin who created them)
- **Tasks the member created themselves** → soft deleted (owner never saw them; archived, not permanently deleted)

---

## Notifications

- When a task is assigned to a user → assignee is notified
- When a task's due date arrives → both the assignee AND the owner/admin who assigned it are notified
- Each user manages their own notification preferences (in-app, email, push) — applies to assigned tasks too
- Notification scheduler updated to route reminders to assignees, not just workspace members

---

## Comments & Activity Log

Combined thread per task in the task drawer.

**Comments:**
- Owner, admins, and assignees can post comments on a task
- Free text, shown in chronological order

**Activity log (automatic entries):**
- Task assigned to user
- Assignee removed
- Status changed
- Due date updated
- Priority changed
- Task created

Both comments and activity entries shown in one unified thread, differentiated visually.

---

## Analytics

| Role | Sees |
|---|---|
| Owner / Admin | Workspace-level: tasks completed per member, focus time per member, team productivity overview |
| Member | Their own analytics only (unchanged from current behaviour) |

---

## Schema Changes

### Modified models

**`Task`**
- Add `creatorId String @map("creator_id")` → references `User`
- Migration: set `creatorId` to the workspace owner for all existing tasks

**`WorkspaceMember`**
- Add `canSeeAllTasks Boolean @default(false) @map("can_see_all_tasks")`
- Migration: set `canSeeAllTasks = true` for all existing members
- Roles validated to: `"owner"` | `"admin"` | `"member"`

### New models

**`TaskAssignee`** (join table)
```
taskId  String → Task
userId  String → User
assignedById String → User (who assigned)
assignedAt DateTime @default(now())
@@unique([taskId, userId])
```

**`TaskComment`**
```
id          String @id
taskId      String → Task
userId      String → User
content     String @db.Text
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```

**`TaskActivity`**
```
id        String @id
taskId    String → Task
userId    String → User (who triggered it)
type      String  // assigned | unassigned | status_changed | due_date_changed | priority_changed | created
metadata  Json?   // e.g. { from: "pending", to: "in_progress" } or { assigneeId: "..." }
createdAt DateTime @default(now())
```

---

## Backend Changes

### Membership cache
- Currently caches boolean membership only
- Update to cache role alongside membership so role checks don't hit the DB every request

### `assertMember`
- Update to return role alongside membership check
- Used as the base for all permission guards

### Role guards
- Owner-only: delete workspace, remove member, toggle `canSeeAllTasks`, promote/demote roles
- Owner + Admin: assign tasks, add/remove assignees
- All members: create own tasks, comment on assigned tasks

### `tasks.list()` — visibility filter
The most critical change. Add a visibility layer based on role + `canSeeAllTasks`:
```
if owner or admin:
  where: { OR: [{ creatorId: userId }, { assignees: { some: { assignedById: userId } } }] }
if member + canSeeAllTasks:
  where: { workspaceId } (unchanged, sees all)
if member + !canSeeAllTasks:
  where: { OR: [{ creatorId: userId }, { assignees: { some: { userId } } }] }
```
Same filter applied to `tasks.findOne()` and dashboard queries.

### New endpoints
- `POST /workspaces/:id/tasks/:taskId/assign` — assign users to task
- `DELETE /workspaces/:id/tasks/:taskId/assign/:userId` — remove assignee
- `GET /workspaces/:id/tasks/:taskId/comments` — list comments + activity
- `POST /workspaces/:id/tasks/:taskId/comments` — post comment
- `DELETE /workspaces/:id/tasks/:taskId/comments/:commentId` — delete own comment
- `PATCH /workspaces/:id/members/:userId` — update `canSeeAllTasks` (owner only)

---

## Frontend Changes

### Task drawer
- Assignee picker: search workspace members, add/remove assignees
- Show current assignees (avatars + names)
- Comments + activity log thread at the bottom of the drawer

### Task cards
- Show assignee avatars (up to 3, then +N overflow)
- Show project name as read-only label if task belongs to a project the member can't access

### Task creation modal
- Add assignee picker field

### Workspace settings page
- Member list with roles
- Owner can: promote to admin, demote to member, toggle `canSeeAllTasks`, remove member
- Visual indicator per member of their current visibility access

### Dashboard
- "Assigned to me" section — tasks assigned to the current user across the workspace
- Owner/admin: see unassigned tasks they created

### Analytics page
- Owner/admin: new workspace-level tab showing per-member stats
- Member: unchanged

---

## Migration Plan

> **DB environment note**: There is a single Supabase instance shared across all branches. Any migration run locally lands on that database immediately. Steps 1–2 and 4–7 are purely additive and safe to run at any time. Step 3 is the exception — see warning below.

1. Add `creatorId` to `Task` as nullable first, run migration
2. Backfill: set `creatorId` to workspace owner for all existing tasks per workspace
3. Make `creatorId` non-nullable — ⚠️ **run this only when the server is already running the new code that sets `creatorId` on task creation**. If the old server code is still active, task creation will throw a DB constraint error.
4. Add `canSeeAllTasks` to `WorkspaceMember`, default `false`
5. Backfill: set `canSeeAllTasks = true` for all existing members
6. Add `TaskAssignee`, `TaskComment`, `TaskActivity` tables
7. Validate existing `role` values — ensure all workspace creators have `role = "owner"`

> **Branch**: Both `productivity-client` and `productivity-server` use the `tasks` branch for this feature.

---

## Implementation Milestones

### ✅ Milestone 1 — Schema & Migration
Schema applied and migrated. `creatorId` backfilled (1,028 tasks), `canSeeAllTasks` backfilled (95 members).
`creatorId` subsequently made non-nullable (migration `20260515000128_make_creator_id_required`).

### ✅ Milestone 2 — Role enforcement
`assertMember` returns `{ role, canSeeAllTasks }`, cached together. Membership cache stores object not boolean.
`inviteMember` owner-only. `removeMember` owner-only + self-removal blocked. `updateMember` handles role +
canSeeAllTasks in one PATCH; prevents demoting owner. Role change invalidates cache.

### ✅ Milestone 3 — Task visibility filtering
`buildTaskVisibilityWhere` applied to `list`, `findOne`, `bulkUpdate`, `reorder`, and subtask includes.
`tasks.create` sets `creatorId: userId`; recurrence spawn inherits parent `creatorId`.
Scheduler switched to `buildTaskRelevanceWhere` (creator OR assignee OR assigner) so notifications
reach the right people without spamming canSeeAllTasks=true members.

### ✅ Milestone 4 — Assignment
`POST /tasks/:id/assign` + `DELETE /tasks/:id/assign/:userId`. Owner/admin only, no self-assign.
Subtask inherits parent assignees on creation (preserves `assignedById`). `addAssignees` dedupes.
Frontend: `AssigneePicker` (multi-select popover), picker in drawer + modal, stacked avatars on cards.
Picker hidden when no other workspace members exist.

### ✅ Milestone 5 — Member management UI
`removeMember` wraps in a transaction: delete `TaskAssignee` rows, soft-delete creator's tasks, delete membership.
Frontend: Eye/EyeOff toggle per member row (owner-clickable), role dropdown limited to admin/member,
tooltip shows visibility state.

### ✅ Milestone 6 — Assignment notifications
`notifyAssigned` helper fires `task_assigned` notifications on `create` (with assigneeIds) and `addAssignees`
(new assignees only, deduped). Scheduler uses `buildTaskRelevanceWhere` — reminders reach assignee +
assigner regardless of role. All notifications go through `NotificationsService.createAndDeliver` (respects
per-user in-app/email/push prefs + quiet hours).

### ✅ Milestone 7 — Comments & Activity log
`CommentsService`: `getThread` (merged + sorted), `createComment` (owner/admin always; member if assignee),
`deleteComment` (own only). `logActivity` (fire-and-forget) wired to: `created`, `status_changed`,
`due_date_changed`, `priority_changed`, `assigned`, `unassigned`. Frontend: `TaskThread` component
at bottom of task drawer — comment bubbles + activity timeline, post box (⌘Enter) for authorised users.

### ✅ Milestone 8 — Workspace analytics
`getTeamAnalytics` aggregates `DailyStat` by userId, owner/admin only, sorted by tasks desc.
`GET /analytics/team` endpoint. Frontend: Personal/Team tab switcher (hidden from members).
Team tab: per-member card with avatar, role, tasks completed, focus time, and a relative progress bar
(top performer = 100%, others scale proportionally).

---

## Deferred (not in this release)
- Project-scoped membership (architecture is ready to extend)
- Cross-workspace assignment
- Assignee-level subtask overrides (subtasks always inherit parent for now)
- Comment reactions or threading
- Bulk assignment
