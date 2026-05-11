"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { cn } from "@/app/components/ui/utils";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAnalyticsScreen, formatFocusTime, type RangeDays } from "../hooks/useAnalyticsScreen";

// Returns YYYY-MM-DD using local timezone — avoids UTC off-by-one near midnight
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Heatmap ─────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS = 16;

function buildGrid(data: { date: string; count: number }[]) {
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() - today.getDay());

  return Array.from({ length: WEEKS }, (_, wi) => {
    const w = WEEKS - 1 - wi;
    return Array.from({ length: 7 }, (_, d) => {
      const date = new Date(endSunday);
      date.setDate(endSunday.getDate() - w * 7 + d);
      const iso = localDateStr(date);
      return { date: iso, count: byDate.get(iso) ?? 0 };
    });
  });
}

function getColor(count: number) {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2)  return "bg-green-200 dark:bg-green-900";
  if (count <= 5)  return "bg-green-400 dark:bg-green-700";
  if (count <= 8)  return "bg-green-600 dark:bg-green-500";
  return "bg-green-700 dark:bg-green-400";
}

function heatmapFormatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function ActivityHeatmap({
  data,
  metric,
  onMetricChange,
}: {
  data: { date: string; count: number }[];
  metric: "tasks" | "focus";
  onMetricChange: (m: "tasks" | "focus") => void;
}) {
  const weeks = buildGrid(data);
  const unitLabel = metric === "tasks" ? "task" : "session";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Activity Overview</CardTitle>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5 bg-muted/30">
            {(["tasks", "focus"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onMetricChange(m)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  metric === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "tasks" ? "Tasks" : "Focus"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "size-3 flex items-center text-[8px] text-gray-400 dark:text-gray-600 leading-none",
                  i % 2 !== 0 && "opacity-0",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <TooltipProvider>
            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <UITooltip key={di}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "size-3 rounded-sm transition-all hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 cursor-pointer",
                            getColor(day.count),
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {day.count} {unitLabel}{day.count !== 1 ? "s" : ""} on {heatmapFormatDate(day.date)}
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[
              "bg-gray-100 dark:bg-gray-800",
              "bg-green-200 dark:bg-green-900",
              "bg-green-400 dark:bg-green-700",
              "bg-green-600 dark:bg-green-500",
              "bg-green-700 dark:bg-green-400",
            ].map((cls, i) => (
              <div key={i} className={cn("size-3 rounded-sm", cls)} />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, components }: {
  score: number;
  components: { taskScore: number; focusScore: number; streakScore: number };
}) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = score >= 70 ? "#047857" : score >= 40 ? "#d97706" : "#d4183d";

  const breakdown = [
    { label: "Tasks",  pts: components.taskScore,   max: 50, color: "#8b5cf6" },
    { label: "Focus",  pts: components.focusScore,  max: 30, color: "#f59e0b" },
    { label: "Streak", pts: components.streakScore, max: 20, color: "#047857" },
  ];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative size-28">
        <svg className="size-28 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
          <circle
            cx="48" cy="48" r={r}
            fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">/ 100</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {score >= 70
          ? "Excellent! Keep it up!"
          : score >= 40
          ? "Good progress. Push a bit more!"
          : "Complete tasks and focus sessions to grow your score"}
      </p>

      <div className="w-full space-y-2">
        {breakdown.map(({ label, pts, max, color: c }) => (
          <div key={label} className="space-y-0.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{label}</span>
              <span className="tabular-nums">{Math.round(pts)}/{max} pts</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(pts / max) * 100}%`, background: c }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Range toggle ─────────────────────────────────────────────────────────────

function RangeToggle({ value, onChange }: { value: RangeDays; onChange: (v: RangeDays) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5 bg-muted/30">
      {([7, 30, 90] as RangeDays[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
            value === r
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}d
        </button>
      ))}
    </div>
  );
}

// ── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "12px",
};

// ── Main screen ──────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const [heatmapMetric, setHeatmapMetric] = useState<"tasks" | "focus">("tasks");

  const {
    isLoading, error,
    totals, chartData, last7,
    avgDaily, productivityScore, scoreComponents,
    heatmapData,
    selectedRange, setSelectedRange,
  } = useAnalyticsScreen();

  if (isLoading) return <ScreenLoader variant="app" />;

  const rangeLabel = `last ${selectedRange} days`;

  const heatmapDisplay = heatmapData.map((d) => ({
    date: d.date,
    count: heatmapMetric === "tasks" ? d.tasks : Math.round(d.focus / 25),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <RangeToggle value={selectedRange} onChange={setSelectedRange} />
      </div>

      {error && <p role="alert" className="text-sm text-destructive py-8 text-center">Failed to load analytics</p>}

      {!error && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tasks completed",  value: totals.tasksCompleted,               sub: rangeLabel },
              { label: "Current streak",   value: `${totals.streak}d`,                 sub: "keep going" },
              { label: "Avg. daily tasks", value: avgDaily,                             sub: rangeLabel },
              { label: "Focus time",       value: formatFocusTime(totals.focusMinutes), sub: rangeLabel },
            ].map(({ label, value, sub }) => (
              <div key={label} className="px-4 py-3 rounded-xl border border-border/60 bg-card">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-xl font-semibold tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Zap className="size-3.5 text-primary" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-2">
                <ScoreRing score={productivityScore} components={scoreComponents} />
              </CardContent>
            </Card>

            {/* Last 7 days */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                {last7.every((d) => d.completed === 0) ? (
                  <p className="text-center py-8 text-muted-foreground text-xs">No tasks completed in the last 7 days.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={last7} barSize={20}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
                      <Bar dataKey="completed" name="Tasks" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{selectedRange}-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.every((d) => d.tasks === 0 && d.focus === 0) ? (
                  <p className="text-center py-8 text-muted-foreground text-xs">No data for this period.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={170}>
                      <ComposedChart data={chartData}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          interval={Math.floor(selectedRange / 7)}
                        />
                        <YAxis yAxisId="tasks" hide domain={[0, "auto"]} />
                        <YAxis yAxisId="focus" hide orientation="right" domain={[0, "auto"]} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) =>
                            name === "Focus min" ? [`${value} min`, "Focus"] : [value, "Tasks"]
                          }
                        />
                        <Line yAxisId="tasks" type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Tasks" />
                        <Line yAxisId="focus" type="monotone" dataKey="focus" stroke="#f59e0b" strokeWidth={2} dot={false} name="Focus min" />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-5 mt-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#8b5cf6]" />Tasks</div>
                      <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-[#f59e0b]" />Focus</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Heatmap */}
            <div className="lg:col-span-3">
              <ActivityHeatmap
                data={heatmapDisplay}
                metric={heatmapMetric}
                onMetricChange={setHeatmapMetric}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
