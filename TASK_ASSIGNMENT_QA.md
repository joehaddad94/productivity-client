# Task Assignment Feature — QA Checklist

Run these checks before merging `tasks` → `development`.

---

## 1. Smoke test (solo, ~15 min)

### Activity log
- [ ] Create a new task → open it in the drawer → "Comments & Activity" section shows **"created this task"**
- [ ] Change the task's status → a **status_changed** entry appears in the thread
- [ ] Change the due date → a **due_date_changed** entry appears
- [ ] Change the priority → a **priority_changed** entry appears

### Comments
- [ ] Type a comment and post it (⌘Enter or click button) → comment appears in thread
- [ ] Hover over your own comment → delete button appears → delete it → comment disappears
- [ ] Comment box is visible (you are the owner, so always allowed to comment)

### Analytics
- [ ] Go to Analytics → Personal tab works as before (streak, heatmap, charts intact)
- [ ] Team tab is visible (you are the owner) → shows your own stats row with a progress bar

### Workspace settings
- [ ] Open workspace settings → member list shows Eye/EyeOff icons next to each member row
- [ ] Role dropdown only shows **admin** and **member** (not owner)
- [ ] Clicking the Eye icon shows a toast confirming the visibility change

### Task cards
- [ ] Tasks with no assignees show no avatars (no empty space)

---

## 2. Multi-user test (requires inviting a second account, ~20 min)

### Invite
- [ ] Invite a second email from workspace settings → invite email is sent
- [ ] Second user joins and appears in the member list with role **member** and canSeeAllTasks toggle shown

### Assignment
- [ ] Assign a task to the second user → they receive a **"Task assigned"** notification
- [ ] The task appears in the second user's task list
- [ ] Assignee avatars appear on the task card

### Visibility
- [ ] With **canSeeAllTasks = off** (EyeOff): second user can only see tasks assigned to them — your private tasks do not appear
- [ ] With **canSeeAllTasks = on** (Eye): second user can see all workspace tasks

### Comments (cross-user)
- [ ] Owner posts a comment → second user can see it when they open the task
- [ ] Second user (as assignee) can post a comment → owner can see it
- [ ] Second user cannot delete the owner's comment

### Assignment notifications
- [ ] When a task's due date arrives, **both** the assignee and the owner get a reminder (not other members)

### Member removal
- [ ] Remove the second user → their task assignments are cleared automatically
- [ ] Tasks they created privately are soft-deleted (no longer visible to anyone)
- [ ] They can no longer access the workspace

### Team analytics
- [ ] Team tab shows a row per member with tasks completed, focus time, and a progress bar
- [ ] The top performer's bar is full width; others scale proportionally
- [ ] Members (non-owner/admin) do not see the Team tab — only their own Personal analytics

---

## 3. E2E suite

```bash
cd C:\Users\Joe\Desktop\productivity-client
npx playwright test
```

- [ ] All 123 tests pass
- [ ] No regressions in: tasks, notes, pomodoro, calendar, analytics, notifications, projects, settings

---

## 4. Merge to development

Only proceed after steps 1–3 are green.

- [ ] Open PR: `tasks` → `development` on **productivity-server**
- [ ] Open PR: `tasks` → `development` on **productivity-client**
- [ ] No DB work needed at merge time — the `creatorId` migration is already live in Supabase

---

## Notes

- The `creatorId` non-nullable migration (`20260515000128_make_creator_id_required`) is already applied to Supabase. Do not run it again.
- Existing tasks (created before this feature) will have empty Comments & Activity threads — that is expected. New tasks log from creation onwards.
- The multi-user paths (assignment, comments, team analytics) cannot be tested without a real second user in the workspace.
