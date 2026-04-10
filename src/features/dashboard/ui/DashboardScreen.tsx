"use client";

import { useState } from "react";
import { Plus, Flame, Clock, CheckCheck, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { TaskCard } from "@/app/components/TaskCard";
import { cn } from "@/app/components/ui/utils";
import { useDashboardScreen } from "../hooks/useDashboardScreen";

function relativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen() {
  const [overdueExpanded, setOverdueExpanded] = useState(false);
  const {
    workspaceId,
    newTaskTitle,
    setNewTaskTitle,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    pendingTasks,
    totals,
  } = useDashboardScreen();

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{greeting()}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayTasks.length > 0
              ? `You have ${todayTasks.length} task${todayTasks.length !== 1 ? "s" : ""} due today`
              : "No tasks due today — enjoy the day"}
          </p>
        </div>
        <Button
          onClick={() => {
            const title = window.prompt("Task title:");
            if (title?.trim()) {
              setNewTaskTitle(title.trim());
              setTimeout(() => handleAddTask(), 0);
            }
          }}
          disabled={!workspaceId}
          size="sm"
        >
          <Plus className="size-3.5" />
          New task
        </Button>
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a task and press Enter…"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          disabled={!workspaceId || createMutation.isPending}
          className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
        />
        <Button
          onClick={handleAddTask}
          disabled={!workspaceId || !newTaskTitle.trim() || createMutation.isPending}
          size="sm"
          variant="outline"
        >
          Add
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — task sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</h2>
              <span className="text-xs text-muted-foreground">{todayTasks.length} tasks</span>
            </div>
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border/40 text-sm text-muted-foreground">
                <CheckCheck className="size-4 text-primary" />
                Nothing due today
              </div>
            ) : (
              <div className="space-y-1.5">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                ))}
              </div>
            )}
          </section>

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <button
                className="flex items-center justify-between w-full mb-3 group"
                onClick={() => setOverdueExpanded((v) => !v)}
              >
                <h2 className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  Overdue · {overdueTasks.length}
                </h2>
                {overdueExpanded ? (
                  <ChevronUp className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>
              {overdueExpanded && (
                <div className="space-y-1.5">
                  {overdueTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                </div>
              )}
              {!overdueExpanded && (
                <div className="space-y-1.5">
                  {overdueTasks.slice(0, 2).map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                  {overdueTasks.length > 2 && (
                    <button
                      onClick={() => setOverdueExpanded(true)}
                      className="text-xs text-muted-foreground hover:text-foreground pl-3"
                    >
                      +{overdueTasks.length - 2} more
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h2>
              <div className="space-y-1">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-1.5 px-1">
                    <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="flex-1 text-sm truncate">{task.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {task.dueDate ? relativeDate(task.dueDate.slice(0, 10)) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending (no due date) */}
          {pendingTasks.filter((t) => !t.dueDate).length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">No due date</h2>
              <div className="space-y-1.5">
                {pendingTasks.filter((t) => !t.dueDate).map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right — compact stats */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stats</h2>
          <StatRow icon={<CheckCheck className="size-3.5 text-primary" />} label="Completed" value={totals.tasksCompleted} suffix="this month" />
          <StatRow icon={<Flame className="size-3.5 text-amber-500" />} label="Streak" value={totals.streak} suffix={`day${totals.streak !== 1 ? "s" : ""}`} />
          <StatRow
            icon={<Clock className="size-3.5 text-blue-500" />}
            label="Focus time"
            value={`${(totals.focusMinutes / 60).toFixed(1)}h`}
            suffix="this month"
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string | number; suffix: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
      <span className="text-[11px] text-muted-foreground">{suffix}</span>
    </div>
  );
}
