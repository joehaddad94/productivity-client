"use client";

import { Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsScreen } from "../hooks/useAnalyticsScreen";

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color =
    score >= 70 ? "#047857" : score >= 40 ? "#d97706" : "#d4183d";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-28">
        <svg className="size-28 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-32">
        {score >= 70
          ? "Excellent — keep it up!"
          : score >= 40
          ? "Good progress — push a bit more"
          : "Complete tasks and focus sessions to grow your score"}
      </p>
    </div>
  );
}

export function AnalyticsScreen() {
  const {
    isLoading,
    error,
    totals,
    chartData,
    last7,
    focusHours,
    avgDaily,
    productivityScore,
    heatmapData,
  } = useAnalyticsScreen();

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="text-sm text-destructive py-8 text-center">Failed to load analytics</p>}

      {!isLoading && !error && (
        <>
          {/* Compact stat row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tasks completed", value: totals.tasksCompleted },
              { label: "Current streak", value: `${totals.streak}d` },
              { label: "Avg. daily tasks", value: avgDaily },
              { label: "Focus time", value: `${focusHours}h` },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 rounded-xl border border-border/60 bg-card">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Productivity score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-4">
                <ScoreRing score={productivityScore} />
              </CardContent>
            </Card>

            {/* Last 7 days */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                {last7.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-xs">No data yet. Complete tasks to see activity.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={last7} barSize={20}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                      />
                      <Bar dataKey="completed" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 30-day trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">30-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-xs">No data for this period.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "12px",
                          }}
                        />
                        <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Tasks" />
                        <Line type="monotone" dataKey="focus" stroke="#f59e0b" strokeWidth={2} dot={false} name="Focus min" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-5 mt-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-[#8b5cf6]" />
                        Tasks
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-[#f59e0b]" />
                        Focus min
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Heatmap */}
            <div className="lg:col-span-3">
              <ActivityHeatmap data={heatmapData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
