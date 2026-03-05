import { TrendingUp, Target, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ProductivityWidget } from "@/app/components/ProductivityWidget";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const weeklyData = [
  { day: "Mon", completed: 8, created: 12 },
  { day: "Tue", completed: 12, created: 10 },
  { day: "Wed", completed: 6, created: 8 },
  { day: "Thu", completed: 10, created: 11 },
  { day: "Fri", completed: 14, created: 9 },
  { day: "Sat", completed: 5, created: 3 },
  { day: "Sun", completed: 3, created: 2 },
];

const monthlyData = [
  { month: "Jan", tasks: 85 },
  { month: "Feb", tasks: 112 },
  { month: "Mar", tasks: 98 },
  { month: "Apr", tasks: 120 },
  { month: "May", tasks: 105 },
  { month: "Jun", tasks: 95 },
];

const categoryData = [
  { name: "Work", value: 45 },
  { name: "Personal", value: 25 },
  { name: "Learning", value: 20 },
  { name: "Health", value: 10 },
];

const COLORS = ["#047857", "#8b5cf6", "#0d9488", "#f59e0b"];

export function Analytics() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your productivity and performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductivityWidget
          title="Total Tasks Completed"
          value="127"
          icon={CheckCircle2}
          trend="This month"
          color="text-green-600 dark:text-green-400"
        />
        <ProductivityWidget
          title="Completion Rate"
          value="87%"
          icon={Target}
          trend="+5% from last month"
          color="text-primary"
        />
        <ProductivityWidget
          title="Avg. Daily Tasks"
          value="4.2"
          icon={TrendingUp}
          trend="+0.3 from last month"
          color="text-purple-600 dark:text-purple-400"
        />
        <ProductivityWidget
          title="Focus Time"
          value="18h"
          icon={Clock}
          trend="This week"
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
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
                <Bar dataKey="created" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#047857]" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-[#64748b]" />
                <span>Created</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="month" className="text-xs" />
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
                  dot={{ fill: "#8b5cf6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <div>
          <ActivityHeatmap />
        </div>
      </div>
    </div>
  );
}
