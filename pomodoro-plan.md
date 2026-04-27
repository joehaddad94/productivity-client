# Pomodoro audit & tracking

**What this file is for:** Log intent + checklist of focus/Pomodoro scenarios so we can mark what we’ve reviewed, fixed, or decided.

**I was going to do next (agent):** Triage the checklist below; align focus logging, layout, and notifications. Also close **Product / UX** items: no-task session rules, better task linking at scale, and inline timer controls on tasks.

## Session lifecycle

- [ ] 1. Session completes normally → toast/notification/auto-start
- [ ] 2. User pauses mid-session and never resumes (walks away)
- [ ] 3. User skips a work session — focus time should NOT be logged
- [ ] 4. User resets mid-session — no focus time logged
- [ ] 5. Timer paused most of session then completed — actual focus vs full configured duration (decision)

## Tab/page behavior

- [x] 6. Navigate away while running — widget persists in layout
- [x] 7. Refresh while running — `savedAt` restores elapsed
- [ ] 8. Tab closed hours, reopens — session may have expired; silent advance, no time logged
- [ ] 9. Tab in background — `setInterval` throttled; countdown freezes, `savedAt` catches on restore

## Task linking

- [ ] 10. Linked task completed (terminal) while session runs — list updates, `linkedId` stale; focus still logs at end
- [ ] 11. Linked task deleted while session runs — same
- [ ] 12. User switches workspace mid-session — task from old workspace

## Product / UX (to discuss & build)

- [ ] **No task linked:** Agree on behavior when the user starts the timer **without** linking a task (focus log rules, nudge to link, allow anonymous sessions, etc.).
- [ ] **Widget task picker at scale:** Current linking in the widget is **not user-friendly** when the number of tasks grows—needs a better pattern (search, recents, empty state, or move linking elsewhere).
- [ ] **Inline task controls:** Add an **inline button** on each task (list/detail) to **start / stop (or link)** the focus timer for that task, so users aren’t forced through the widget-only flow.

## Notifications

- [ ] 13. Browser notifications on but permission denied — silent fail, no fallback
- [ ] 14. Notifications + toasts off — silent session end
- [ ] 15. Break ends with auto-start off — more prominent cue to resume?

## Settings mid-session

- [ ] 16. Increase work duration while running — `secondsLeft` old, `total` new → progress ring jumps
- [x] 17. `sessionsBeforeLongBreak` change — dots/next long break; current count unchanged

## Cycle / session count

- [ ] 18. Session count never resets (only total ever)—reset per long-break cycle?
- [ ] 19. After full cycle (work×N + long) — no celebration/reset

## Focus time accuracy

- [ ] 20. Logs configured `workMinutes` on complete regardless of pause — use actual running time?

## Workspace / auth

- [x] 21. No workspace (`wsId` null) — focus log fails gracefully
- [ ] 22. Logout mid-session — timer in localStorage, resumes as guest

## Mobile / layout

- [ ] 23. Expanded panel ~304px on small screens — may overlap content
- [ ] 24. Task picker on mobile — may clip upward

---

*Mark `[x]` when scenario has been **reviewed** and outcome noted (or fixed). Use notes under a scenario if needed.*
