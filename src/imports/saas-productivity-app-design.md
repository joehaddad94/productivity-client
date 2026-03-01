Design a modern, minimal SaaS web application for personal productivity.

This is a responsive web app (not a native mobile app).
Primary experience is desktop (1440px), but it must adapt beautifully to tablet and mobile browser.

The product helps users manage tasks, notes, daily planning, and productivity tracking.

The style should feel clean, focused, and premium — similar to Todoist simplicity + Notion structure + Linear polish.

🧱 Create the Following Frames
1️⃣ Desktop – Dashboard (1440px)

Layout:

Left sidebar (fixed width ~240px)

Main content area

Optional right detail panel (collapsible)

Sidebar items:

Dashboard (active state)

Tasks

Notes

Calendar

Analytics

Settings

Dashboard sections (vertical scroll):

Section 1 – “Today”

Overdue tasks (red indicator)

Due today

Priority tasks

Section 2 – Quick Add

Inline quick add task input

“Add Note” button

Section 3 – Upcoming (Next 7 days)

Task list preview

Section 4 – Productivity Overview

Card: Tasks completed today

Card: Weekly completion rate

Card: Current streak

Small activity heatmap (GitHub style)

Use Auto Layout everywhere.

2️⃣ Desktop – Tasks Page

Layout:

Sidebar

Task list view (center)

Task detail panel (right, collapsible)

Include:

Filter tabs: Today / Upcoming / Completed / Priority

“Add Task” primary button

Search bar

Task card component

Task Card Component must include:

Checkbox

Task title

Due date

Priority badge

Status

Optional tag

Hover state

Completed state variant

Create component variants for:

Default

Overdue

Completed

High priority

3️⃣ Desktop – Notes Page

Layout:

Sidebar

Notes list (left column)

Editor (main area)

Editor should support:

Rich text layout

Title input

Tag selector

“Convert to Task” button

Clean distraction-free style

Create:

Note list item component

Tag component

Editor toolbar component

4️⃣ Focus Mode Screen

Full-width layout:

Large task title

Subtasks checklist

Optional Pomodoro timer UI

Minimal UI (no sidebar)

Exit button top-left

📱 Responsive Requirements

Create separate frames for:

Tablet (1024px)

Sidebar collapsible

Two-column layout

Dashboard stacked tighter

Mobile (390px)

Sidebar becomes hamburger menu

Dashboard stacks vertically

Quick add input fixed at bottom

Task cards compact

Editor full-width

Focus mode fully immersive

Use constraints properly.
Use auto layout to ensure stacking behavior.

🎨 Design System

Create reusable styles:

Colors

Neutral background (light gray)

Primary action (blue)

Overdue (red)

Medium priority (orange)

Completed (green)

Dark mode palette

Typography

Modern sans-serif

Clear hierarchy:

H1

H2

Body

Caption

Components

Buttons (primary / secondary / ghost)

Input fields

Dropdown

Modal

Notification dropdown

Sidebar item (default / active / hover)

Badge

Card container

Include both Light Mode and Dark Mode variants.

✨ Interaction States

Include:

Hover states

Active states

Completed task animation suggestion

Notification bell with unread badge

Subtle shadows

Smooth modern spacing (8px grid system)

🧠 Overall Feel

Calm

Fast

Professional

Focused on execution

Minimal but powerful

SaaS-ready

Avoid clutter.
Prioritize readability and task clarity.