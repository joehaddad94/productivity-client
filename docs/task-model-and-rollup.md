# Tasky — Task Model & the Personal Rollup

> **Status:** Decision record — Accepted and implemented
> **Date:** 2026-06-18 · **Decisions resolved:** 2026-07-20 · **Implemented:** 2026-09-10
> **Scope:** How workspaces, projects, assignment, and a personal cross-workspace view fit together.

---

## TL;DR

Tasky is, and stays, a **team-first** product: a `Task` belongs to a `Workspace`, and workspaces are the collaboration and permission boundary. On top of that we add a **personal rollup** — a workspace-independent "my day" view that aggregates everything *assigned to you* across *every* workspace, plus your personal tasks.

The rollup is a **superset**: a solo user is just a user whose rollup happens to draw from a single (personal) workspace. So we get the personal-tool experience without giving up team scalability, and we never have to migrate away from it.

**Assignment is the bridge** between the team layer and the personal layer — assigning a task is what injects it into someone's personal day.

---

## 1. The contradiction we're resolving

| The promise | The architecture (today) |
| --- | --- |
| User-centric. The landing page says *"Tasks, notes, and focus, finally in one place"* and *"manage your day."* A person's day mixes personal and work tasks without caring which team each came from. | Workspace-centric. A `Task` belongs to exactly one `Workspace`; every query is scoped by `workspaceId`; the UI puts you *inside* one workspace at a time via a switcher. |

The product says *the user is the center*; the data model says *the workspace is the center, and the user is just a member of several*. The daily-driver question — **"what should I do today?"** — has no single place that can answer it.

## 2. The decision

**Keep the workspace as the root entity (team-first). Add a user-centric rollup as an overlay.**

We do **not** remove workspaces — they do a real job (membership, roles, who-can-assign, who-sees-what). Instead we change the *center of gravity*: the workspace stops being a mode you're forced to be "in," and a personal cross-workspace layer sits on top.

**Why this model (and not personal-first):**
- The rollup is a **superset** — it contains the personal-first experience as a degenerate case (one personal workspace).
- It **scales without migration** — adding teams later never requires re-rooting the data model.
- It **preserves the collaboration machinery** already built (roles, assignment, visibility).

## 3. The architecture: two read models

The same tasks are read through two lenses:

1. **Workspace-scoped (team) view** — what exists today: `/workspaces/:workspaceId/tasks`, governed by workspace role + visibility rules. The collaboration surface.
2. **User-scoped (personal) view** — new: a `/me/tasks` query that fans out across **every workspace the user belongs to** and returns everything that's "theirs." The daily driver.

### Assignment is the bridge

Assigning a team task to someone is the exact mechanism that injects it into their personal rollup. This elevates assignment from a side "permission feature" to the **core mechanic that makes Tasky cohere** — personal day and team boards become one system instead of two apps bolted together.

> **Design test for everything we build next:** *does this make the right things show up in the right person's day?*

### The aggregation is asymmetric

- Personal/"my day" views pull **up** across all workspaces.
- A team workspace view stays **scoped to itself**.

Personal tasks never leak into the team; team tasks roll up into your day. That asymmetry is the whole trick.

## 4. The surface

A new **top-level "Home / My Tasks" area that lives *outside* any workspace** — the first truly workspace-independent place in the app. It has **two lenses over the same `/me/tasks` data**:

- **List lens** (default) — Today / Upcoming / Overdue / **No date**. Handles triage and everything undated.
- **Calendar lens** — the time view. *"What's on my plate this week."*

**Why a calendar makes sense as a lens:** time is the only axis that is inherently personal and cross-workspace — "Tuesday" is the same Tuesday regardless of which workspace a task is in. A calendar naturally dissolves the workspace boundary, and Tasky's calendar already overlays Google/Microsoft events, so a cross-workspace task layer on top is a strong, differentiated "my day."

**Why the calendar can't be the *whole* rollup:** a calendar only shows *dated* tasks. A large share of real tasks are undated (backlog / someday). Those would be invisible — hence the companion **List lens**.

**Change required:** the existing Calendar page graduates from workspace-scoped ("this team's calendar") to cross-workspace ("my calendar"). *(Implemented 2026-09-10: `/calendar` reads `/me/tasks`; per-task mutations carry their own workspace id via `useCrossWorkspaceTasks`.)*

## 5. What qualifies as "mine"

The rollup is keyed on **assignee**, not creator:

- ✅ Tasks **assigned to me**, in any workspace.
- ✅ Everything in my **personal workspace**.
- ❌ Tasks I **created in a team but delegated to someone else** — those are *theirs* now, and belong in *their* day, not mine.

This also means **assignment quality directly determines rollup quality** — another reason assignment is the core mechanic.

*(Performance note: `TaskAssignee` already has `@@index([userId])`, so "assigned to me across workspaces" is cheap. "Created by me across workspaces" is not indexed — which reinforces keying the rollup on assignee.)*

## 6. Resolved decisions

> Resolved 2026-07-20. Each resolution below is grounded in the current schema/services (see Appendix).

### 6.1 Mixed status vocabularies → **canonical 3-bucket derivation**

**Decision:** the rollup groups by a fixed canonical set — **`open` / `in_progress` / `done`** — and each `WorkspaceTaskStatus` is *derived* into a bucket rather than requiring per-status configuration for v1:

```
isTerminal === true            → done
else if key === 'in_progress'  → in_progress
else                           → open        // includes all custom, key=null statuses
```

This works because every workspace is seeded with the three built-ins (`key` = `pending` / `in_progress` / `completed`, with `completed.isTerminal = true`), and the schema guarantees each workspace keeps ≥1 non-terminal and ≥1 terminal status. Custom statuses (`key = null`) collapse to `open` unless terminal.

- **Presentation:** the rollup groups/sorts by canonical bucket, but each row still renders its *native* status name + `color`, so Team A's "In Review" shows as itself under the `in_progress` group. No information is lost, only ordered.
- **Legacy raw-key rows (confirmed in live data 2026-07-20):** 14 / 1082 tasks store a bare key string (`pending` ×12, `completed` ×1, `in_progress` ×1) in `Task.status` instead of a `WorkspaceTaskStatus.id` — pre-migration rows the create path no longer produces. The mapper **must accept both**: if `Task.status` matches a `WorkspaceTaskStatus.id`, derive from that row; otherwise treat the value as a legacy key (`completed` → `done`, `in_progress` → `in_progress`, anything else → `open`). A cleanup migration to backfill these 14 rows onto real status ids is advisable but not a blocker. *(Written 2026-09-10 as `20260910190000_backfill_legacy_task_status_keys`; all 14 rows verified resolvable. The mapper still accepts both shapes regardless.)*
- **Escape hatch (deferred, not v1):** if collapsing every custom non-terminal status to `open` proves too lossy, add an optional `canonicalBucket` column to `WorkspaceTaskStatus` that overrides the derivation (e.g. map "In Review" → `in_progress` explicitly). The derivation above becomes the default value, so this is a purely additive change.
- **Analytics:** consumes the *same* derivation helper so cross-workspace completion/throughput charts are consistent with the rollup. One shared mapper, one source of truth. *(Implemented 2026-09-10: `TaskStatusesService.isTerminal` routes through `deriveBucket`/`legacyKeyBucket` instead of its own lookup, which had been reporting legacy `completed` rows as non-terminal and double-counting them on completion.)*

### 6.2 Quick-add target → **personal workspace by default, active team context if in one, always overridable**

**Decision:** a task quick-added from Home ("Today" / List) lands in the user's **personal workspace** (`isPersonal = true`) by default — it is guaranteed to exist and is the natural home for personal triage. **Exception:** if the user quick-adds while a specific team workspace is the active context (navigated in from that board), default to *that* workspace instead. In all cases the quick-add exposes an explicit **workspace picker** that remembers the last-used target for the session.

- The new task is **assigned to the creator by default**, because assignment is the bridge (§3) — an unassigned task in a team workspace would not roll back up into the creator's day. In the personal workspace this is a no-op (single member) but keeps the rule uniform. *(Extended 2026-09-10 to every quick-add without an assignee picker — Dashboard, Calendar, Tasks board, Project detail — not just Home. Before that only Home applied the rule, and 1080 of 1083 live tasks carried no assignee at all, which left the rollup inert. `CreateTaskModal` is exempt: it has an explicit picker, so an empty selection there stays a deliberate unassigned draft.)*
- Quick-add always targets an *open* status via the workspace's default open status (`getDefaultOpenStatusId`).

### 6.3 "Mine" edge cases → **assignee-or-personal-workspace only; follow/comment is awareness, not ownership**

**Decision:** the default rollup is exactly:

```
(tasks where I am an assignee, in ANY workspace)              — via TaskAssignee.userId  (already @@index([userId]))
UNION
(tasks in a personal workspace I belong to, where I am        — isPersonal = true AND (creatorId = me OR assignee = me)
 creator or assignee)
```

Edge cases pinned down:

- **Created-but-delegated → OUT.** Already decided (§5); it belongs to the assignee's day. Keying the team side on `TaskAssignee.userId` (not `creatorId`) gives this for free.
- **Follow / comment but not assigned → OUT of the default rollup.** Commenting or following is *awareness*, not ownership; pulling these into "my day" would erode its "these are the things I have to do" contract. This is deliberately narrower than the notification relevance rule.
- **Personal-workspace tasks I didn't assign to myself → IN (via `creatorId`).** In a solo personal workspace people rarely self-assign, so a pure assignee key would hide their own tasks. We therefore also include personal-workspace tasks I *created*. **Correction (live data 2026-07-20):** personal workspaces are **not** guaranteed single-member — observed up to **5 members**. So the earlier "all tasks in my personal workspace are mine" rule is unsafe (it would leak a co-member's tasks into my day). The inclusion is scoped to `creatorId = me OR assignee = me`, never "all tasks in the workspace." *(Side note: personal workspaces with multiple members may itself be a data/onboarding smell worth a separate look — a truly personal workspace arguably shouldn't accept invites.)*
- **Optional "Following" view (deferred):** awareness tasks (creator-or-assigner-or-commented) are still reachable through a *secondary, opt-in* filter/tab that reuses the existing `buildTaskRelevanceWhere` fragment — kept out of the default List/Calendar so the daily driver stays actionable.

**Net:** the `/me/tasks` query is `TaskAssignee.userId = me  OR  (workspace.isPersonal AND workspace.member = me AND (creatorId = me OR TaskAssignee.userId = me))`, over non-deleted tasks, deduplicated by task id.

---

### Live verification (2026-07-20)

Resolutions above were checked read-only against the running DB (1082 non-deleted tasks, 99 workspaces):
- **6.1 derivation** — confirmed: built-in `completed` is the only terminal built-in; `pending`/`in_progress` non-terminal; 3 custom statuses are `key=null`, non-terminal → `open`. **But** 14 tasks carry legacy raw-key strings → mapper must accept both (see §6.1).
- **Seeding** — all 99 workspaces have their statuses seeded (0 unseeded); lazy-seed risk not present in current data, though `/me/tasks` should still tolerate an unseeded workspace.
- **6.3 personal-workspace membership** — personal workspaces have **1–5 members**, invalidating the single-member assumption; §6.3 rule revised accordingly.

## 7. How this reframes projects & assignment

With positioning settled, **projects become a sub-structure of the team layer**, and the rollup mostly ignores them (project is just context-metadata on a rolled-up task). So the project-membership / project-roles / who-can-assign question is now purely a **team-collaboration** concern — it no longer has to serve the personal day. That simplifies it considerably, and is the next thread to design.

---

## Appendix — current model (for reference)

- `Workspace` has an `isPersonal` flag; it owns `projects`, `tasks`, `notes`, members, and per-workspace task statuses.
- `WorkspaceMember` holds `role` (`owner` / `admin` / `member`). **Roles live only at the workspace level.** *(Updated 2026-09-10: the `canSeeAllTasks` flag documented here was removed — schema column, DTO field, membership cache and the owner-only toggle. Visibility now keys off a task's assignment state: a task with no assignees is private to its creator, and self-assigning is what promotes it into the leadership layer's view.)*
- `Project` is a labeled bucket inside a workspace (name, color, status). **No membership, no roles, no access control.**
- `Task` belongs to a workspace, optionally to a project (`projectId` is **nullable**), and has `assignees` via `TaskAssignee` (`userId` + `assignedById`).
- Today, assignment and visibility are decided by **workspace** role (`buildTaskVisibilityWhere`); only workspace owner/admin can assign.
