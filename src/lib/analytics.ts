import posthog from "posthog-js";

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // handled manually in PostHogProvider
    capture_pageleave: true,
    session_recording: { maskAllInputs: false, maskInputOptions: { password: true } },
    persistence: "localStorage",
  });
}

export function identifyUser(id: string, props: { name?: string | null; email?: string }) {
  if (typeof window === "undefined") return;
  posthog.identify(id, { name: props.name ?? undefined, email: props.email });
}

export function resetAnalyticsUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

type EventMap = {
  // Core engagement
  task_created:              { has_due_date: boolean; has_priority: boolean; is_recurring: boolean; has_project: boolean };
  task_completed:            { had_due_date: boolean; had_priority: boolean };
  note_created:              {};
  pomodoro_session_completed: { session_type: "work" | "short_break" | "long_break"; duration_minutes: number; had_linked_task: boolean };

  // Feature adoption
  calendar_connected:        { provider: "google" | "microsoft" };
  recurring_task_created:    { rule: "DAILY" | "WEEKLY" | "MONTHLY" };
  note_converted_to_task:    {};

  // Onboarding
  workspace_created:         {};
  first_task_created:        {};
  first_note_created:        {};
};

export function track<E extends keyof EventMap>(event: E, props: EventMap[E]) {
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}
