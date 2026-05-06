"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useAnalyticsQuery } from "@/app/hooks/useAnalyticsApi";

export type RangeDays = 7 | 30 | 90;

// 16 weeks — always fetch enough for the full heatmap
const HEATMAP_DAYS = 112;

// Use local date components to avoid UTC off-by-one near midnight
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: localDateStr(from), to: localDateStr(to) };
}

export function formatFocusTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function computeScoreComponents(
  tasksCompleted: number,
  focusMinutes: number,
  streak: number,
  rangeDays: number,
) {
  // Benchmarks scale with the selected range so score is always meaningful
  const taskBenchmark  = Math.round(50  * rangeDays / 30); // ~50 tasks / 30 days
  const focusBenchmark = Math.round(750 * rangeDays / 30); // ~25 min / day
  const taskScore  = Math.min(tasksCompleted / taskBenchmark,  1) * 50;
  const focusScore = Math.min(focusMinutes   / focusBenchmark, 1) * 30;
  const streakScore = Math.min(streak / 7, 1) * 20;
  return { taskScore, focusScore, streakScore };
}

export function useAnalyticsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [selectedRange, setSelectedRange] = useState<RangeDays>(30);

  // Always fetch 112 days so the heatmap is fully populated
  const fullRange = useMemo(() => getDateRange(HEATMAP_DAYS), []);
  const { data, isLoading, error } = useAnalyticsQuery(workspaceId, fullRange);
  const allDailyStats = data?.dailyStats ?? [];

  // O(1) date lookup
  const statsMap = useMemo(
    () => new Map(allDailyStats.map((s) => [s.date.slice(0, 10), s])),
    [allDailyStats],
  );

  // Stats filtered to the selected range
  const rangeFrom = useMemo(() => getDateRange(selectedRange).from, [selectedRange]);
  const statsInRange = useMemo(
    () => allDailyStats.filter((s) => s.date.slice(0, 10) >= rangeFrom),
    [allDailyStats, rangeFrom],
  );

  const totals = useMemo(() => ({
    tasksCompleted: statsInRange.reduce((a, s) => a + s.tasksCompleted, 0),
    focusMinutes:   statsInRange.reduce((a, s) => a + s.focusMinutes,   0),
    streak: data?.totals.streak ?? 0, // always current streak, independent of range
  }), [statsInRange, data?.totals.streak]);

  // Average over calendar days in the range (not just active days)
  const avgDaily = Math.round((totals.tasksCompleted / selectedRange) * 10) / 10;

  // Last 7 actual calendar days (fills 0 for inactive days)
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = localDateStr(d);
    const stat = statsMap.get(iso);
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      completed: stat?.tasksCompleted ?? 0,
      focus: stat?.focusMinutes ?? 0,
    };
  }), [statsMap]);

  // Chart data over actual calendar days for selected range
  const chartData = useMemo(() => Array.from({ length: selectedRange }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (selectedRange - 1 - i));
    const iso = localDateStr(d);
    const stat = statsMap.get(iso);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tasks: stat?.tasksCompleted ?? 0,
      focus: stat?.focusMinutes ?? 0,
    };
  }), [selectedRange, statsMap]);

  const scoreComponents = useMemo(
    () => computeScoreComponents(totals.tasksCompleted, totals.focusMinutes, totals.streak, selectedRange),
    [totals, selectedRange],
  );
  const productivityScore = Math.round(
    scoreComponents.taskScore + scoreComponents.focusScore + scoreComponents.streakScore,
  );

  // Heatmap always covers full 112 days; normalize date to YYYY-MM-DD local
  const heatmapData = useMemo(
    () => allDailyStats.map((s) => ({
      date: s.date.slice(0, 10),
      tasks: s.tasksCompleted,
      focus: s.focusMinutes,
    })),
    [allDailyStats],
  );

  return {
    isLoading,
    error,
    totals,
    chartData,
    last7,
    avgDaily,
    productivityScore,
    scoreComponents,
    heatmapData,
    selectedRange,
    setSelectedRange,
  };
}
