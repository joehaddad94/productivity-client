import Link from "next/link";
import {
  SquareCheck,
  FileText,
  Timer,
  CalendarDays,
  BarChart2,
  FolderOpen,
  Bell,
  Moon,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Tasky",
  description: "Everything Tasky can do for your productivity.",
};

const SECTIONS = [
  {
    icon: SquareCheck,
    title: "Tasks",
    tagline: "A full task manager that gets out of your way.",
    description:
      "Create tasks with titles, descriptions, priorities, and due dates. Build a system that fits your workflow.",
    bullets: [
      "Subtasks — break big tasks into smaller steps",
      "Recurring tasks — daily, weekly, or monthly",
      "Custom statuses — your own workflow columns",
      "Priorities, due dates, and times",
      "Filter by status, priority, project, or date",
      "Bulk actions on multiple tasks",
    ],
  },
  {
    icon: FileText,
    title: "Notes",
    tagline: "Rich notes that link to your work.",
    description:
      "A clean rich-text editor with everything you need and nothing you don't. Notes connect directly to tasks and projects.",
    bullets: [
      "Rich formatting — headings, lists, code blocks",
      "Autosave on every keystroke",
      "Tags for categorisation",
      "Link a note to any task",
      "Convert a note into a task instantly",
      "Group notes under projects",
    ],
  },
  {
    icon: Timer,
    title: "Focus Timer",
    tagline: "Built-in Pomodoro that respects your flow.",
    description:
      "Start a focus session, link it to a task, and let the timer track your effort automatically.",
    bullets: [
      "Configurable work and break durations",
      "Link sessions to specific tasks",
      "Automatic focus time logging",
      "Session counter and long-break cycles",
      "Sound and browser notification alerts",
      "Floating widget — always one click away",
    ],
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    tagline: "See your full schedule in one place.",
    description:
      "Tasks with due dates appear on the calendar. Connect external calendars to see everything together.",
    bullets: [
      "Month, week, and day views",
      "Tasks with due dates shown automatically",
      "Google Calendar integration",
      "Microsoft Outlook integration",
      "External events alongside your tasks",
    ],
  },
  {
    icon: BarChart2,
    title: "Analytics",
    tagline: "Understand how you actually work.",
    description:
      "Track output, focus time, and consistency over time. Build awareness without obsessing.",
    bullets: [
      "Activity heatmap — last 90 days at a glance",
      "Productivity score combining tasks, focus, and streak",
      "Weekly completion rate",
      "Daily focus time tracking",
      "Consecutive-day streak counter",
    ],
  },
  {
    icon: FolderOpen,
    title: "Projects",
    tagline: "Organise work by context.",
    description:
      "Group tasks and notes under projects. Switch between them in seconds with their own colour and status.",
    bullets: [
      "Colour-coded project cards",
      "Per-project task and note views",
      "Active or archived status",
      "Open task count per project",
    ],
  },
  {
    icon: Bell,
    title: "Notifications & Reminders",
    tagline: "Stay on top — without being interrupted.",
    description:
      "Smart reminders for what matters, delivered the way you want them.",
    bullets: [
      "Due today and overdue reminders",
      "Daily agenda at a time you pick",
      "In-app notification bell",
      "Email notifications",
      "Push notifications in the browser",
      "Quiet hours support",
    ],
  },
  {
    icon: Moon,
    title: "Appearance",
    tagline: "Looks great everywhere.",
    description:
      "Designed for long focus sessions. Light or dark, always readable, always polished.",
    bullets: [
      "Light, dark, or follow system",
      "Clean Linear/Notion-inspired design",
      "Responsive — desktop, tablet, mobile",
      "Accessible — WCAG AA contrast",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ───── Header ───── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-12 sm:pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-60" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-6">
            <Zap className="size-3" />
            All features included free during beta
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Everything{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Tasky
            </span>{" "}
            can do
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A focused productivity workspace — no feature bloat, just the tools you actually use.
          </p>
        </div>
      </section>

      {/* ───── Sections ───── */}
      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
          {SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            const isEven = idx % 2 === 1;
            return (
              <div
                key={section.title}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center ${isEven ? "md:[&>div:first-child]:order-2" : ""}`}
              >
                {/* Text */}
                <div>
                  <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
                    {section.title}
                  </h2>
                  <p className="text-base text-foreground/80 leading-relaxed mb-2">
                    {section.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* Bullets in a styled card */}
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/[0.03] dark:bg-primary/[0.05] blur-2xl rounded-3xl -z-10" />
                  <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-7">
                    <ul className="space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-sm">
                          <Check className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative px-4 sm:px-6 py-20 mt-8">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-50" />
        </div>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Try it all — free during beta
          </h2>
          <p className="text-muted-foreground mb-7">
            No credit card. No catch. Just a focused workspace built for getting things done.
          </p>
          <Button asChild size="lg" className="h-11 px-6 shadow-lg shadow-primary/20">
            <Link href="/signup">
              Get started for free
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
