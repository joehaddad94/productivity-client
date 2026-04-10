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

export function useAnalyticsScreen() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const [range] = useState(() => getDateRange(30));

  const { data, isLoading, error } = useAnalyticsQuery(workspaceId, range);
  const dailyStats = data?.dailyStats ?? [];
  const totals = data?.totals ?? { tasksCompleted: 0, focusMinutes: 0, streak: 0 };

  const chartData = dailyStats.map((s) => ({
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tasks: s.tasksCompleted,
    focus: s.focusMinutes,
  }));
  const last7 = dailyStats.slice(-7).map((s) => ({
    day: new Date(s.date).toLocaleDateString("en-US", { weekday: "short" }),
    completed: s.tasksCompleted,
  }));
  const focusHours = Math.round((totals.focusMinutes / 60) * 10) / 10;
  const avgDaily = dailyStats.length > 0 ? Math.round((totals.tasksCompleted / dailyStats.length) * 10) / 10 : 0;

  return { isLoading, error, totals, chartData, last7, focusHours, avgDaily };
}
