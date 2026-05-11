"use client";

import { useState, useRef } from "react";
import { Plus, Flame, Clock, CheckCheck, ChevronDown, ChevronUp, ListTodo, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { TaskCard } from "@/app/components/TaskCard";
import { cn } from "@/app/components/ui/utils";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { useAuth } from "@/app/context/AuthContext";
import { useDashboardScreen } from "../hooks/useDashboardScreen";
import { PriorityToggle } from "./PriorityToggle";
import { relativeDate, greeting, todayLabel, formatFocusTime } from "@/lib/date-utils";

export function DashboardScreen() {
  const { user } = useAuth();
  const [overdueExpanded, setOverdueExpanded] = useState(true);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const {
    workspaceId,
    newTaskTitle, setNewTaskTitle,
    newTaskPriority, setNewTaskPriority,
    tasksLoading,
    createMutation,
    handleAddTask,
    handleToggleTask,
    taskStatuses,
    todayAllTasks,
    todayTasks,
    todayCompleted,
    overdueTasks,
    upcomingTasks,
    noDateTasks,
    totals,
    projects,
    openTasksByProject,
    last7Days,
    activeDates,
    todayStr,
    isEmpty,
  } = useDashboardScreen();

  const firstName = user?.name?.split(" ")[0] ?? null;
  const todayTotal = todayAllTasks.length;
  const progressPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayLabel()} &middot;{" "}
            {tasksLoading
              ? "Loading…"
              : todayTasks.length > 0
                ? `${todayTasks.length} task${todayTasks.length !== 1 ? "s" : ""} due today`
                : "No tasks due today. Enjoy the day!"}
          </p>
        </div>
        <Button onClick={() => quickAddRef.current?.focus()} disabled={!workspaceId} size="sm">
          <Plus className="size-3.5" />
          New task
        </Button>
      </div>

      {/* Quick add */}
      <div className="flex gap-2">
        <input
          ref={quickAddRef}
          type="text"
          aria-label="New task title"
          placeholder="Add a task and press Enter…"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          disabled={!workspaceId || createMutation.isPending}
          className="flex-1 h-9 px-3 text-sm bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
        />
        <PriorityToggle value={newTaskPriority} onChange={setNewTaskPriority} />
        <Button
          onClick={() => handleAddTask()}
          disabled={!workspaceId || !newTaskTitle.trim() || createMutation.isPending}
          variant="outline"
          className="h-9 px-4"
        >
          Add
        </Button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ListTodo className="size-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first task above, or head to the Tasks page to get started.
            </p>
          </div>
          <Link href="/tasks">
            <Button variant="outline" size="sm">Go to Tasks</Button>
          </Link>
        </div>
      )}

      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — task sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</h2>
                {!tasksLoading && todayTotal > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {todayCompleted}/{todayTotal} done
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {!tasksLoading && todayTotal > 0 && (
                <div
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Today's progress: ${todayCompleted} of ${todayTotal} tasks done`}
                  className="h-1 w-full bg-muted rounded-full mb-3 overflow-hidden"
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}

              {tasksLoading ? (
                <ScreenLoader variant="app" />
              ) : todayTasks.length === 0 && todayTotal === 0 ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border/40 text-sm text-muted-foreground">
                  <CheckCheck className="size-4 text-primary" />
                  Nothing due today
                </div>
              ) : todayTasks.length === 0 && todayTotal > 0 ? (
                <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border/40 text-sm text-muted-foreground">
                  <CheckCheck className="size-4 text-primary" />
                  All done for today 🎉
                </div>
              ) : (
                <div className="space-y-1.5">
                  {todayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} taskStatuses={taskStatuses} onToggle={handleToggleTask} />
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
                  {overdueExpanded
                    ? <ChevronUp className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    : <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  }
                </button>
                {overdueExpanded && (
                  <div className="space-y-1.5">
                    {overdueTasks.map((task) => (
                      <TaskCard key={task.id} task={task} taskStatuses={taskStatuses} onToggle={handleToggleTask} />
                    ))}
                  </div>
                )}
                {!overdueExpanded && (
                  <div className="space-y-1.5">
                    {overdueTasks.slice(0, 2).map((task) => (
                      <TaskCard key={task.id} task={task} taskStatuses={taskStatuses} onToggle={handleToggleTask} />
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h2>
                  <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-1.5 px-1">
                      <span aria-hidden="true" className={cn(
                        "size-1.5 rounded-full shrink-0",
                        task.priority === "high" ? "bg-red-500"
                          : task.priority === "medium" ? "bg-amber-500"
                          : "bg-muted-foreground/30",
                      )} />
                      <span className="flex-1 text-sm truncate">{task.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {task.dueDate ? relativeDate(task.dueDate.slice(0, 10)) : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No due date */}
            {noDateTasks.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No due date</h2>
                  <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {noDateTasks.map((task) => (
                    <TaskCard key={task.id} task={task} taskStatuses={taskStatuses} onToggle={handleToggleTask} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Projects */}
            {projects.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</h2>
                  <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    View all
                  </Link>
                </div>
                <div className="space-y-1">
                  {projects.map((project) => {
                    const open = openTasksByProject[project.id] ?? 0;
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: project.color ?? "var(--primary)" }}
                        />
                        <span className="flex-1 text-sm truncate group-hover:text-foreground text-muted-foreground">
                          {project.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                          {open > 0 ? `${open} open` : <FolderOpen className="size-3 opacity-40" aria-hidden="true" />}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This month</h2>
              <StatRow
                icon={<CheckCheck className="size-3.5 text-primary" />}
                label="Completed"
                value={totals.tasksCompleted}
                suffix="tasks"
              />
              <StatRow
                icon={<Clock className="size-3.5 text-blue-500" />}
                label="Focus time"
                value={formatFocusTime(totals.focusMinutes)}
                suffix=""
              />

              {/* Streak with 7-day dots */}
              <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
                <Flame className="size-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-sm text-muted-foreground">Streak</span>
                <div className="flex items-center gap-1" role="list" aria-label="Last 7 days activity">
                  {last7Days.map((day) => {
                    const isToday = day === todayStr;
                    const active = activeDates.has(day);
                    return (
                      <span
                        key={day}
                        role="listitem"
                        aria-label={`${day}${active ? ": active" : isToday ? ": today, no activity" : ": no activity"}`}
                        className={cn(
                          "size-2 rounded-full transition-colors",
                          active
                            ? "bg-amber-500"
                            : isToday
                              ? "bg-muted-foreground/20 ring-1 ring-amber-400/50"
                              : "bg-muted-foreground/15",
                        )}
                      />
                    );
                  })}
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {totals.streak}d
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ icon, label, value, suffix }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
      {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
    </div>
  );
}
