import { Sparkles, Rocket } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Tasky",
  description: "What's new in Tasky.",
};

type Entry = {
  date: string;
  tag: string;
  tagColor: "primary" | "muted";
  title: string;
  description?: string;
  groups: {
    label: string;
    items: string[];
  }[];
  icon: typeof Rocket;
};

const ENTRIES: Entry[] = [
  {
    date: "May 2026",
    tag: "Beta launch",
    tagColor: "primary",
    title: "Tasky is now in beta",
    description:
      "After months of focused work, Tasky is ready for its first users. Here's everything that ships in v0.1.",
    icon: Rocket,
    groups: [
      {
        label: "Core features",
        items: [
          "Task management with priorities, due dates, subtasks, and recurring tasks",
          "Rich text notes with tags, autosave, and task linking",
          "Convert a note to a task in one click",
          "Projects — group tasks and notes by context",
          "Multiple workspaces",
        ],
      },
      {
        label: "Focus & productivity",
        items: [
          "Built-in Pomodoro timer with task linking",
          "Automatic focus time logging per task",
          "Activity heatmap and productivity score",
          "Daily streak counter",
        ],
      },
      {
        label: "Calendar & notifications",
        items: [
          "Calendar view with month, week, and day modes",
          "Google Calendar and Microsoft Outlook sync",
          "Due-date reminders — in-app, email, and push",
          "Daily agenda notification at a time you choose",
          "Quiet hours support",
        ],
      },
      {
        label: "Polish",
        items: [
          "Dark mode and light mode",
          "Mobile-responsive design",
          "Keyboard accessibility throughout",
          "WCAG AA accessibility compliance",
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ───── Header ───── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-12 sm:pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-60" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-6">
            <Sparkles className="size-3" />
            What&apos;s new
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Changelog
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Every update, improvement, and new feature. Newest first.
          </p>
        </div>
      </section>

      {/* ───── Entries ───── */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line — only between entries */}
            {ENTRIES.length > 1 && (
              <div className="absolute left-[19px] top-10 bottom-10 w-px bg-border hidden sm:block" />
            )}

            <div className="space-y-10">
              {ENTRIES.map((entry) => {
                const Icon = entry.icon;
                return (
                  <article key={entry.date} className="relative flex flex-col sm:flex-row gap-5 sm:gap-6">
                    {/* Icon column */}
                    <div className="relative sm:pt-2">
                      <div className="size-10 rounded-full border-2 border-primary/30 bg-card flex items-center justify-center shrink-0 relative z-10">
                        <Icon className="size-4 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          entry.tagColor === "primary"
                            ? "border border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {entry.tag}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                        {entry.title}
                      </h2>

                      {entry.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                          {entry.description}
                        </p>
                      )}

                      {/* Grouped items */}
                      <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
                        {entry.groups.map((group) => (
                          <div key={group.label} className="p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                              {group.label}
                            </p>
                            <ul className="space-y-2">
                              {group.items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm">
                                  <span className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                                  <span className="text-foreground/90">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
