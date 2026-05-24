import Link from "next/link";
import type { Metadata } from "next";
import {
  SquareCheck,
  FileText,
  Timer,
  CalendarDays,
  BarChart2,
  FolderOpen,
  Bell,
  ArrowRight,
  Sparkles,
  Zap,
  Eye,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ProductPreview } from "@/app/components/marketing/ProductPreview";

export const metadata: Metadata = {
  title: "Tasky — Tasks, notes, and focus in one place",
  description:
    "A focused productivity workspace combining tasks, rich notes, and a built-in Pomodoro timer. Free during beta — no credit card required.",
  openGraph: {
    title: "Tasky — Tasks, notes, and focus in one place",
    description:
      "A focused productivity workspace combining tasks, rich notes, and a built-in Pomodoro timer.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ───── Hero ───── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        {/* Background — soft radial primary glow + grid */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 dark:bg-primary/15 blur-[120px] rounded-full opacity-60" />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Beta badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary text-xs font-medium mb-8 shadow-sm shadow-primary/10">
            <Sparkles className="size-3" />
            <span>Free during beta · No credit card required</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 max-w-4xl">
            Tasks, notes, and focus —{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                finally in one place.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            Tasky combines a clean task manager, rich notes, and a built-in focus timer into a single workspace.
            Built for people who want to do their best work without juggling five different apps.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-16 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto h-11 px-6 shadow-lg shadow-primary/20">
              <Link href="/signup">
                Get started — it&apos;s free
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6">
              <Link href="/features">See it in action</Link>
            </Button>
          </div>

          {/* Product preview */}
          <ProductPreview />
        </div>
      </section>

      {/* ───── Trust strip ───── */}
      <section className="px-4 sm:px-6 py-10 border-y border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 text-center">
          {[
            { label: "All-in-one",   value: "1 app",    sub: "instead of 5"    },
            { label: "Free to use",  value: "$0",       sub: "during beta"     },
            { label: "Works on",     value: "Any device",sub: "web, mobile, tablet" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label} · {stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Features — bento grid ───── */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-5">
              <Zap className="size-3" />
              Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Everything you need.{" "}
              <span className="text-muted-foreground">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-muted-foreground">
              A focused set of tools that work together — designed for clarity, built for momentum.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {/* Tasks — large */}
            <FeatureCard
              icon={SquareCheck}
              title="Tasks that get out of your way"
              description="Create, prioritise, and track tasks with subtasks, recurring schedules, and due dates. Custom workflow statuses let you build the system that fits your work."
              className="md:col-span-2 md:row-span-2"
              featured
            />

            {/* Notes */}
            <FeatureCard
              icon={FileText}
              title="Rich notes"
              description="Tags, autosave, and direct task linking. Convert any note to a task in one click."
            />

            {/* Focus Timer */}
            <FeatureCard
              icon={Timer}
              title="Built-in focus timer"
              description="Pomodoro that links to a task. Focus time is logged automatically."
            />

            {/* Calendar — wide */}
            <FeatureCard
              icon={CalendarDays}
              title="Calendar view"
              description="See tasks and events side by side. Google and Outlook sync included."
              className="md:col-span-2"
            />

            {/* Analytics */}
            <FeatureCard
              icon={BarChart2}
              title="Productivity analytics"
              description="Heatmap, score, and streaks. See your progress at a glance."
            />

            {/* Projects — wide */}
            <FeatureCard
              icon={FolderOpen}
              title="Projects"
              description="Group tasks and notes by context. Switch between projects in seconds."
              className="md:col-span-2"
            />

            {/* Notifications */}
            <FeatureCard
              icon={Bell}
              title="Smart reminders"
              description="In-app, email, and push. Quiet hours respected."
            />
          </div>
        </div>
      </section>

      {/* ───── Quote / philosophy ───── */}
      <section className="px-4 sm:px-6 py-24 border-y border-border/60 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <Eye className="size-6 text-primary mx-auto mb-5" aria-hidden />
          <blockquote className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-5">
            &ldquo;The best productivity tool is the one that <span className="text-primary">stays out of your way</span>.&rdquo;
          </blockquote>
          <p className="text-muted-foreground text-sm">
            Tasky is designed around that idea — no clutter, no notifications you didn&apos;t ask for,
            no features you&apos;ll never use. Just the tools you need, exactly when you need them.
          </p>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="relative px-4 sm:px-6 py-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/20 dark:bg-primary/15 blur-[100px] rounded-full opacity-60" />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-5 leading-tight">
            Ready to get more{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              done
            </span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join Tasky today. Free during beta, no credit card.
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

function FeatureCard({
  icon: Icon,
  title,
  description,
  className = "",
  featured,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-border/60 bg-card p-6 hover:border-border transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${className}`}
    >
      {/* Featured: extra glow */}
      {featured && (
        <div className="absolute -inset-x-20 -top-20 h-40 bg-primary/15 dark:bg-primary/10 blur-3xl opacity-50 pointer-events-none" aria-hidden />
      )}

      <div className="relative flex flex-col gap-3 h-full">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          featured ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/15"
        }`}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <h3 className={`font-semibold tracking-tight ${featured ? "text-xl" : "text-base"}`}>{title}</h3>
          <p className={`text-muted-foreground leading-relaxed ${featured ? "text-sm" : "text-sm"}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
