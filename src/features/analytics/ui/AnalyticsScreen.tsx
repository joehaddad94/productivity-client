"use client";

import { TrendingUp, Target, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ProductivityWidget } from "@/app/components/ProductivityWidget";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAnalyticsScreen } from "../hooks/useAnalyticsScreen";

export function AnalyticsScreen() {
  const { isLoading, error, totals, chartData, last7, focusHours, avgDaily } = useAnalyticsScreen();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your productivity and performance</p>
      </div>

      {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-gray-400" /></div>}
      {error && <p className="text-center py-8 text-red-500 text-sm">Failed to load analytics</p>}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProductivityWidget title="Tasks Completed" value={totals.tasksCompleted} icon={CheckCircle2} trend="Last 30 days" color="text-green-600 dark:text-green-400" />
            <ProductivityWidget title="Current Streak" value={`${totals.streak} day${totals.streak !== 1 ? "s" : ""}`} icon={Target} trend="Keep it going!" color="text-primary" />
            <ProductivityWidget title="Avg. Daily Tasks" value={avgDaily} icon={TrendingUp} trend="Last 30 days" color="text-purple-600 dark:text-purple-400" />
            <ProductivityWidget title="Focus Time" value={`${focusHours}h`} icon={Clock} trend="Last 30 days" color="text-orange-600 dark:text-orange-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Last 7 Days</CardTitle></CardHeader>
              <CardContent>
                {last7.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No data yet. Complete tasks to see activity here.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={last7}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} />
                      <Bar dataKey="completed" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>30-Day Trend</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No data for this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem" }} />
                      <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Tasks completed" />
                      <Line type="monotone" dataKey="focus" stroke="#f59e0b" strokeWidth={2} dot={false} name="Focus minutes" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-[#8b5cf6]" /><span>Tasks</span></div>
                  <div className="flex items-center gap-2"><div className="size-3 rounded-full bg-[#f59e0b]" /><span>Focus minutes</span></div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2"><ActivityHeatmap /></div>
          </div>
        </>
      )}
    </div>
  );
}
