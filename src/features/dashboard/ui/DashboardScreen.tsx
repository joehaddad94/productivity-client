"use client";

import {
  CheckCircle2,
  TrendingUp,
  Flame,
  Plus,
  FileText,
  CalendarDays,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskCard } from "@/app/components/TaskCard";
import { ProductivityWidget } from "@/app/components/ProductivityWidget";
import { Button } from "@/app/components/ui/button";
import { useDashboardScreen } from "../hooks/useDashboardScreen";

export function DashboardScreen() {
  const {
    workspaceId,
    newTaskTitle,
    setNewTaskTitle,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    tasks,
    todayTasks,
    overdueTasks,
    pendingTasks,
    completedCount,
    totals,
  } = useDashboardScreen();

  const stats = [
    { label: "Tasks Completed", value: completedCount, change: `${totals.tasksCompleted} this month`, icon: CheckCircle2 },
    { label: "Total Tasks", value: tasks.length, change: "In workspace", icon: FileText },
    { label: "Focus Time", value: `${Math.round((totals.focusMinutes / 60) * 10) / 10}h`, change: "This month", icon: TrendingUp },
    { label: "Streak", value: `${totals.streak} day${totals.streak !== 1 ? "s" : ""}`, change: "Keep it up!", icon: Flame },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Welcome back! Here&apos;s your productivity overview.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm p-4">
        <h2 className="font-semibold mb-3">Quick Add Task</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="What do you need to do?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            disabled={!workspaceId || createMutation.isPending}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <Button
            onClick={handleAddTask}
            disabled={!workspaceId || !newTaskTitle.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/20 dark:border-l-primary/35 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                <Icon className="size-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {overdueTasks.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900 border-l-4 border-l-red-500 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              <h2 className="font-semibold text-red-600 dark:text-red-400">Overdue</h2>
            </div>
            <span className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
              {overdueTasks.length} task{overdueTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pending Tasks</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{pendingTasks.length} remaining</span>
          </div>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              {workspaceId ? "No pending tasks. Add one above!" : "Select a workspace to see tasks"}
            </p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ProductivityWidget
            title="Tasks Completed"
            value={totals.tasksCompleted}
            icon={CheckCircle2}
            trend="This month"
            color="text-green-600 dark:text-green-400"
          />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm p-4">
            <h2 className="font-semibold mb-4">Today&apos;s Due</h2>
            {todayTasks.length === 0 ? (
              <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                <CalendarDays className="size-4 text-primary mt-0.5 flex-shrink-0" />
                <span>No tasks due today</span>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 3).map((task: Task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <CalendarDays className="size-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{task.priority ?? "no priority"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
