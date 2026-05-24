import Link from "next/link";
import {
  SquareCheck,
  FileText,
  Timer,
  CalendarDays,
  BarChart2,
  FolderOpen,
  Bell,
  Building2,
  ChevronRight,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Tasky",
  description: "Learn how to use Tasky.",
};

const GETTING_STARTED = [
  {
    step: "1",
    title: "Create an account",
    description: "Sign up with your email — we'll send you a magic link. No password to remember.",
  },
  {
    step: "2",
    title: "Set up your first workspace",
    description: "A workspace is where your tasks, notes, and projects live. Give it a name and you're in.",
  },
  {
    step: "3",
    title: "Add your first task",
    description:
      "Use the quick-add bar on the dashboard or open the Tasks page. Set a priority and due date to get the most out of your dashboard view.",
  },
  {
    step: "4",
    title: "Capture your thinking in notes",
    description:
      "Notes have rich formatting, tags, and direct task linking. You can even convert any note into a task with one click.",
  },
  {
    step: "5",
    title: "Start a focus session",
    description:
      "The Pomodoro timer sits in the bottom-right corner. Link a task, hit start, and your focus time is logged automatically.",
  },
];

const FEATURE_GUIDES = [
  { icon: SquareCheck,  label: "Tasks",          href: "/features"                },
  { icon: FileText,     label: "Notes",          href: "/features"                },
  { icon: Timer,        label: "Focus Timer",    href: "/features"                },
  { icon: CalendarDays, label: "Calendar",       href: "/features"                },
  { icon: BarChart2,    label: "Analytics",      href: "/features"                },
  { icon: FolderOpen,   label: "Projects",       href: "/features"                },
  { icon: Bell,         label: "Notifications",  href: "/features"                },
  { icon: Building2,    label: "Workspaces",     href: "/features"                },
];

const TIPS = [
  "Use the dashboard quick-add bar to create tasks without leaving your overview.",
  "Link your Pomodoro timer to a task — focus time is logged automatically to that task.",
  "Convert any note to a task with the 'To task' button in the note editor toolbar.",
  "Set recurring tasks for habits or weekly reviews so they appear automatically.",
  "Use tags on notes to group related thinking across different projects.",
  "Connect Google or Microsoft Calendar in Settings → Calendars to see all your events in one view.",
  "Customise your workflow with custom task statuses in Settings.",
  "Toggle dark mode anytime from Settings → Appearance.",
];

export default function DocsPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ───── Header ───── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-12 sm:pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-60" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-6">
            <BookOpen className="size-3" />
            Documentation
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Get up and{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              running
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Everything you need to know to get the most out of Tasky.
          </p>
        </div>
      </section>

      {/* ───── Getting started ───── */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
            Getting started
          </h2>
          <p className="text-muted-foreground mb-10">
            Five steps from signup to your first focus session.
          </p>

          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            {GETTING_STARTED.map((item) => (
              <div key={item.step} className="relative flex gap-5 items-start group">
                {/* Step circle */}
                <div className="relative size-8 rounded-full bg-card border-2 border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0 z-10 group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  {item.step}
                </div>

                <div className="flex-1 pt-1 pb-4">
                  <p className="text-base font-semibold mb-1.5">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Feature guides ───── */}
      <section className="px-4 sm:px-6 py-16 border-t border-border/60 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
            Feature guides
          </h2>
          <p className="text-muted-foreground mb-8">
            Detailed walkthroughs of each feature.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURE_GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.label}
                  href={guide.href}
                  className="group rounded-xl border border-border/60 bg-card p-4 hover:border-border hover:bg-card hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-2"
                >
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{guide.label}</span>
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── Tips ───── */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="size-5 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Tips & tricks
            </h2>
          </div>
          <p className="text-muted-foreground mb-8">
            Small habits that make a big difference.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIPS.map((tip, i) => (
              <div
                key={tip}
                className="rounded-xl border border-border/60 bg-card p-4 flex gap-3 hover:border-border hover:shadow-sm transition-all"
              >
                <div className="size-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-50" />
        </div>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Ready to give it a try?
          </h2>
          <p className="text-muted-foreground mb-7">
            Sign up — the docs above will be even more useful with an account open.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-11 px-6 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/88 transition-colors shadow-lg shadow-primary/20"
          >
            Get started for free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
