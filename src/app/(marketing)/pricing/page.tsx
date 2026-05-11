import Link from "next/link";
import { Check, ArrowRight, Sparkles, Heart } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Tasky",
  description: "Tasky is free during beta.",
};

const INCLUDED = [
  "Unlimited tasks, subtasks, and projects",
  "Unlimited notes with rich text editor",
  "Built-in Pomodoro focus timer",
  "Calendar view with Google & Outlook sync",
  "Productivity analytics and activity heatmap",
  "Notifications — in-app, email, and push",
  "Light and dark mode",
  "Recurring tasks",
  "Tags and task linking",
  "Multiple workspaces",
];

const FAQS = [
  {
    q: "Will Tasky stay free forever?",
    a: "Tasky is free during the beta. We'll introduce paid plans once we launch, but beta users will get early-access benefits and plenty of notice before anything changes.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "Nope. Sign up with just your email — you'll receive a magic link to log in. No password, no card.",
  },
  {
    q: "What happens to my data after beta?",
    a: "Your data stays yours. We'll always support data export, and there will be a free tier when we launch paid plans.",
  },
  {
    q: "How do I share feedback?",
    a: "There's a 'Report a bug' button built into the app. We read every report and respond personally.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ───── Header ───── */}
      <section className="relative px-4 sm:px-6 pt-20 pb-12 sm:pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 dark:bg-primary/10 blur-[100px] rounded-full opacity-60" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="size-3" />
            <span>Beta</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Free during{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              beta
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            All features included. No credit card. No catch.
          </p>
        </div>
      </section>

      {/* ───── Pricing card ───── */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-xl mx-auto relative">
          {/* Glow */}
          <div className="absolute -inset-8 bg-primary/15 dark:bg-primary/10 blur-3xl rounded-3xl -z-10" />

          <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden shadow-xl shadow-primary/5">
            {/* Top accent stripe */}
            <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div className="p-8 sm:p-10">
              {/* Plan name */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    Beta plan
                  </div>
                  <div className="text-base font-medium text-muted-foreground">Everything, included</div>
                </div>
                <Heart className="size-5 text-primary/40" aria-hidden />
              </div>

              {/* Price */}
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl sm:text-6xl font-semibold tracking-tight">$0</span>
                <span className="text-muted-foreground mb-2 text-sm">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Free for everyone during beta — pricing announced before launch.
              </p>

              {/* CTA */}
              <Button asChild size="lg" className="w-full h-11 shadow-md shadow-primary/20 mb-8">
                <Link href="/signup">
                  Get started for free
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>

              {/* Included */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Everything included
                </p>
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-2.5" strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="px-4 sm:px-6 py-20 border-t border-border/60 bg-muted/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-border transition-colors"
              >
                <summary className="flex items-center justify-between gap-3 p-5 cursor-pointer text-sm font-medium list-none">
                  <span>{faq.q}</span>
                  <span className="size-5 rounded-full border border-border flex items-center justify-center text-muted-foreground group-open:rotate-45 transition-transform shrink-0">
                    <span className="text-base leading-none">+</span>
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
