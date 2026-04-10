"use client";

import { TrendingUp, Target, Clock, CheckCircle2, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ProductivityWidget } from "@/app/components/ProductivityWidget";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-100 dark:text-gray-800"
          />
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
          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-32">
        {score >= 70
          ? "Excellent work — keep it up!"
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
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your productivity and performance
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <p className="text-center py-8 text-red-500 text-sm">
          Failed to load analytics
        </p>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProductivityWidget
              title="Tasks Completed"
              value={totals.tasksCompleted}
              icon={CheckCircle2}
              trend="Last 90 days"
              color="text-green-600 dark:text-green-400"
            />
            <ProductivityWidget
              title="Current Streak"
              value={`${totals.streak} day${totals.streak !== 1 ? "s" : ""}`}
              icon={Target}
              trend="Keep it going!"
              color="text-primary"
            />
            <ProductivityWidget
              title="Avg. Daily Tasks"
              value={avgDaily}
              icon={TrendingUp}
              trend="Last 90 days"
              color="text-purple-600 dark:text-purple-400"
            />
            <ProductivityWidget
              title="Focus Time"
              value={`${focusHours}h`}
              icon={Clock}
              trend="Last 90 days"
              color="text-orange-600 dark:text-orange-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Productivity score */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center py-4">
                <ScoreRing score={productivityScore} />
              </CardContent>
            </Card>

            {/* Last 7 days */}
            <Card>
              <CardHeader>
                <CardTitle>Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                {last7.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    No data yet. Complete tasks to see activity here.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={last7}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-800"
                      />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
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
                <CardTitle>30-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    No data for this period.
                  </p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={190}>
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-gray-200 dark:stroke-gray-800"
                        />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="tasks"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          name="Tasks"
                        />
                        <Line
                          type="monotone"
                          dataKey="focus"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          name="Focus min"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full bg-[#8b5cf6]" />
                        <span>Tasks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full bg-[#f59e0b]" />
                        <span>Focus min</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Heatmap full width */}
            <div className="lg:col-span-3">
              <ActivityHeatmap data={heatmapData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
