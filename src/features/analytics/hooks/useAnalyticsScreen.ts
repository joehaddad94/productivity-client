"use client";

import { useState } from "react";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useAnalyticsQuery } from "@/app/hooks/useAnalyticsApi";

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function computeScore(tasksCompleted: number, focusMinutes: number, streak: number): number {
  // Tasks: up to 50 pts — 50 tasks over 30 days is full score
  const taskScore = Math.min(tasksCompleted / 50, 1) * 50;
  // Focus: up to 30 pts — 1 pomodoro/day (25 min × 30 days) is full score
  const focusScore = Math.min(focusMinutes / 750, 1) * 30;
  // Streak: up to 20 pts — 7-day streak is full score
  const streakScore = Math.min(streak / 7, 1) * 20;
  return Math.round(taskScore + focusScore + streakScore);
}

export function useAnalyticsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [range] = useState(() => getDateRange(90));

  const { data, isLoading, error } = useAnalyticsQuery(workspaceId, range);
  const dailyStats = data?.dailyStats ?? [];
  const totals = data?.totals ?? { tasksCompleted: 0, focusMinutes: 0, streak: 0 };

  const chartData = dailyStats.slice(-30).map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tasks: s.tasksCompleted,
    focus: s.focusMinutes,
  }));

  const last7 = dailyStats.slice(-7).map((s) => ({
    day: new Date(s.date).toLocaleDateString("en-US", { weekday: "short" }),
    completed: s.tasksCompleted,
  }));

  const focusHours = Math.round((totals.focusMinutes / 60) * 10) / 10;
  const avgDaily =
    dailyStats.length > 0
      ? Math.round((totals.tasksCompleted / dailyStats.length) * 10) / 10
      : 0;

  const productivityScore = computeScore(
    totals.tasksCompleted,
    totals.focusMinutes,
    totals.streak
  );

  const heatmapData = dailyStats.map((s) => ({
    date: s.date,
    count: s.tasksCompleted,
  }));

  return {
    isLoading,
    error,
    totals,
    chartData,
    last7,
    focusHours,
    avgDaily,
    productivityScore,
    heatmapData,
  };
}
