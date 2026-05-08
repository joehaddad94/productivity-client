"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/components/ui/utils";
import { isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";
import { TaskDrawer } from "@/features/tasks/ui/TaskDrawer";
import {
  DAY_LABELS, MONTH_NAMES, PRIORITY_DOT, CHIP_BG,
  useCalendarScreen, type CalendarView,
} from "../hooks/useCalendarScreen";
import type { Task, TaskStatusDefinition } from "@/lib/types";

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export function CalendarScreen() {
  const {
    now, view, setView,
    viewYear, viewMonth,
    weekDays, weekLabel,
    selectedDate, setSelectedDate,
    handlePrev, handleNext,
    setViewYear, setViewMonth,
    todayYMD,
    cells,
    tasksByDate,
    externalByDate,
    selectedTasks,
    selectedExternalEvents,
    upcomingTasks,
    overdueTasks,
    upcomingLabel,
    agendaGroups,
    taskStatuses,
    projectsForPicker,
    isLoading,
    quickAddTitle, setQuickAddTitle,
    quickAddPriority, setQuickAddPriority,
    showQuickAdd, setShowQuickAdd,
    handleAddTaskOnDate,
    createMutation,
    updateMutation,
    deleteMutation,
    selectedTask,
    showDetail, setShowDetail,
    handleSelectTask,
    handleSave,
    handleDelete,
    handleToggle,
  } = useCalendarScreen();

  const quickAddRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showQuickAdd) quickAddRef.current?.focus();
  }, [showQuickAdd]);

  const selectedLabel =
    selectedDate === todayYMD
      ? "Today"
      : new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "short", month: "short", day: "numeric",
        });

  const incompleteTasks = selectedTasks.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
  const completedTasks  = selectedTasks.filter((t) =>  isTaskStatusTerminal(t.status, taskStatuses));

  // Navigation label depends on view
  const navLabel = view === "week"
    ? weekLabel
    : `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
          {(["month", "week", "agenda"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: grid or agenda ─────────────────────────────────── */}
        <div className={cn(view === "agenda" ? "lg:col-span-3" : "lg:col-span-2")}>

          {/* Navigation bar */}
          {view !== "agenda" && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">{navLabel}</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePrev}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost" size="sm" className="h-7 px-2 text-xs"
                  onClick={() => {
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                    setSelectedDate(todayYMD);
                  }}
                >
                  Today
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleNext}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Day-of-week header */}
          {view !== "agenda" && (
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "text-center text-[11px] font-medium py-1",
                    (i === 0 || i === 6) ? "text-muted-foreground/40" : "text-muted-foreground",
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
          )}

          {/* ── Month grid ── */}
          {view === "month" && (
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
              {isLoading
                ? Array.from({ length: 42 }).map((_, i) => (
                    <div key={i} className="bg-background min-h-[80px] animate-pulse" />
                  ))
                : cells.map((day, idx) => {
                    if (day === null) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className={cn(
                            "bg-background min-h-[80px]",
                            (idx % 7 === 0 || idx % 7 === 6) && "bg-muted/20",
                          )}
                        />
                      );
                    }

                    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayTasks    = tasksByDate.get(ymd) ?? [];
                    const dayExternal = externalByDate.get(ymd) ?? [];
                    const isToday    = ymd === todayYMD;
                    const isSelected = ymd === selectedDate;
                    const isPast     = ymd < todayYMD;
                    const isWeekend  = idx % 7 === 0 || idx % 7 === 6;

                    const activeTasks    = dayTasks.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
                    const completedCount = dayTasks.length - activeTasks.length;
                    const hasOverdue     = isPast && activeTasks.length > 0;

                    // Visible chips: 2 tasks + up to 1 external if room, rest overflow
                    const visibleTasks    = activeTasks.slice(0, 2);
                    const remainingSlots  = 2 - visibleTasks.length;
                    const visibleExternal = dayExternal.slice(0, remainingSlots > 0 ? 1 : 0);
                    const overflowCount   =
                      (activeTasks.length - visibleTasks.length) +
                      (dayExternal.length - visibleExternal.length);

                    return (
                      <button
                        key={ymd}
                        onClick={() => setSelectedDate(ymd)}
                        className={cn(
                          "min-h-[80px] flex flex-col gap-0.5 pt-1.5 pb-1.5 px-1 transition-colors text-sm relative cursor-pointer",
                          isWeekend && !isSelected ? "bg-muted/20" : "bg-background",
                          isSelected && "bg-primary/10 ring-inset ring-1 ring-primary",
                          isToday && !isSelected && "ring-inset ring-1 ring-primary",
                          hasOverdue && !isSelected && "bg-red-500/5",
                          !isSelected && "hover:bg-muted/50",
                        )}
                      >
                        <span className={cn(
                          "text-[11px] font-medium leading-none self-center mb-0.5",
                          isToday && "flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground font-semibold",
                          !isToday && isPast && !isSelected && "text-muted-foreground/50",
                          !isToday && isWeekend && !isSelected && !isPast && "text-muted-foreground/60",
                        )}>
                          {day}
                        </span>

                        {visibleTasks.map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              "w-full px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium",
                              CHIP_BG[t.priority ?? ""] ?? "bg-primary/15 text-primary",
                            )}
                          >
                            {t.title}
                          </div>
                        ))}

                        {visibleExternal.map((ev) => (
                          <div
                            key={ev.id}
                            className="w-full px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium bg-blue-500/15 text-blue-400"
                          >
                            {ev.title}
                          </div>
                        ))}

                        <div className="flex items-center gap-1 mt-auto px-0.5">
                          {overflowCount > 0 && (
                            <span className="text-[9px] text-muted-foreground leading-none">
                              +{overflowCount} more
                            </span>
                          )}
                          {completedCount > 0 && (
                            <span className="text-[9px] text-emerald-400/60 leading-none ml-auto">
                              ✓{completedCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
            </div>
          )}

          {/* ── Week grid ── */}
          {view === "week" && (
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
              {weekDays.map((ymd, i) => {
                const d = new Date(ymd + "T00:00:00");
                const day = d.getDate();
                const dayTasks    = tasksByDate.get(ymd) ?? [];
                const dayExternal = externalByDate.get(ymd) ?? [];
                const isToday    = ymd === todayYMD;
                const isSelected = ymd === selectedDate;
                const isPast     = ymd < todayYMD;
                const isWeekend  = i === 0 || i === 6;

                const activeTasks    = dayTasks.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
                const completedTasks = dayTasks.filter((t) =>  isTaskStatusTerminal(t.status, taskStatuses));
                const hasOverdue     = isPast && activeTasks.length > 0;

                return (
                  <button
                    key={ymd}
                    onClick={() => setSelectedDate(ymd)}
                    className={cn(
                      "min-h-[140px] flex flex-col gap-0.5 pt-1.5 pb-1.5 px-1 transition-colors text-sm cursor-pointer",
                      isWeekend && !isSelected ? "bg-muted/20" : "bg-background",
                      isSelected && "bg-primary/10 ring-inset ring-1 ring-primary",
                      isToday && !isSelected && "ring-inset ring-1 ring-primary",
                      hasOverdue && !isSelected && "bg-red-500/5",
                      !isSelected && "hover:bg-muted/50",
                    )}
                  >
                    <span className={cn(
                      "text-[11px] font-medium leading-none self-center mb-0.5",
                      isToday && "flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground font-semibold",
                      !isToday && isPast && !isSelected && "text-muted-foreground/50",
                    )}>
                      {day}
                    </span>

                    {/* All active tasks — no limit in week view */}
                    {activeTasks.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "w-full px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium",
                          CHIP_BG[t.priority ?? ""] ?? "bg-primary/15 text-primary",
                        )}
                      >
                        {t.title}
                      </div>
                    ))}

                    {dayExternal.map((ev) => (
                      <div
                        key={ev.id}
                        className="w-full px-1.5 py-0.5 rounded text-[10px] leading-tight truncate font-medium bg-blue-500/15 text-blue-400"
                      >
                        {ev.title}
                      </div>
                    ))}

                    {completedTasks.length > 0 && (
                      <span className="text-[9px] text-emerald-400/60 leading-none mt-auto px-0.5">
                        ✓{completedTasks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend — shown under month and week grids */}
          {view !== "agenda" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-red-400/40 border border-red-400/60" />High</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-orange-400/40 border border-orange-400/60" />Medium</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-gray-400/40 border border-gray-400/60" />Low</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-blue-500/30 border border-blue-500/50" />External event</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400/70 font-medium">✓</span>Completed</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-red-500/20 border border-red-500/30" />Overdue</span>
            </div>
          )}

          {/* ── Agenda view ── */}
          {view === "agenda" && (
            <div className="space-y-6">
              {/* Overdue group */}
              {overdueTasks.length > 0 && (
                <AgendaGroup
                  label="Overdue"
                  labelClass="text-red-400"
                  tasks={overdueTasks}
                  taskStatuses={taskStatuses}
                  todayYMD={todayYMD}
                  onSelectTask={handleSelectTask}
                  onToggle={handleToggle}
                  showDate
                />
              )}

              {/* Future groups */}
              {Array.from(agendaGroups.entries())
                .filter(([ymd]) => ymd >= todayYMD)
                .map(([ymd, tasks]) => {
                  const d = new Date(ymd + "T00:00:00");
                  const label = ymd === todayYMD
                    ? "Today"
                    : d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
                  return (
                    <AgendaGroup
                      key={ymd}
                      label={label}
                      labelClass={ymd === todayYMD ? "text-primary" : undefined}
                      tasks={tasks}
                      taskStatuses={taskStatuses}
                      todayYMD={todayYMD}
                      onSelectTask={handleSelectTask}
                      onToggle={handleToggle}
                    />
                  );
                })}

              {agendaGroups.size === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">No tasks with due dates yet.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel (month + week only) ─────────────────────── */}
        {view !== "agenda" && (
          <div className="space-y-5">

            {/* Selected day */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {selectedLabel}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd((v) => !v)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Add task on this date"
                >
                  {showQuickAdd ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                </button>
              </div>

              {/* Quick-add */}
              {showQuickAdd && (
                <div className="flex flex-col gap-1.5 mb-2.5">
                  <input
                    ref={quickAddRef}
                    type="text"
                    placeholder="New task title…"
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTaskOnDate();
                      if (e.key === "Escape") { setShowQuickAdd(false); setQuickAddTitle(""); }
                    }}
                    disabled={createMutation.isPending}
                    className="h-8 px-2.5 text-xs bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={quickAddPriority}
                      onChange={(e) => setQuickAddPriority(e.target.value as "high" | "medium" | "low" | "none")}
                      className="flex-1 h-7 px-2 text-xs bg-muted/40 border border-border/60 rounded-md outline-none focus:border-primary/40 text-muted-foreground cursor-pointer"
                    >
                      <option value="none">No priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <Button
                      size="sm"
                      className="h-7 px-3"
                      onClick={handleAddTaskOnDate}
                      disabled={!quickAddTitle.trim() || createMutation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {selectedTasks.length === 0 && selectedExternalEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tasks or events — click + to add one.</p>
              ) : (
                <div className="space-y-1.5">
                  {incompleteTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      taskStatuses={taskStatuses}
                      onOpen={handleSelectTask}
                      onToggle={handleToggle}
                    />
                  ))}

                  {selectedExternalEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card">
                      <span className={cn("size-1.5 rounded-full shrink-0", ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500")} />
                      <span className="text-xs truncate flex-1">{ev.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {!ev.allDay && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(ev.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground cursor-pointer">
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {completedTasks.length > 0 && (
                    <>
                      {incompleteTasks.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/50 pt-1 pl-1">Completed</p>
                      )}
                      {completedTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          taskStatuses={taskStatuses}
                          onOpen={handleSelectTask}
                          onToggle={handleToggle}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Upcoming this month / Tasks in <month> */}
            {upcomingLabel && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  {upcomingLabel}
                </h3>
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No open tasks this {MONTH_NAMES[viewMonth].toLowerCase()}.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {upcomingTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleSelectTask(task)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors text-left cursor-pointer"
                      >
                        <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary")} />
                        <span className="text-xs truncate flex-1">{task.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(task.dueDate!.slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past month: show overdue instead */}
            {!upcomingLabel && overdueTasks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-2.5">
                  Overdue
                </h3>
                <div className="space-y-1.5">
                  {overdueTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                    >
                      <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary")} />
                      <span className="text-xs truncate flex-1">{task.title}</span>
                      <span className="text-[10px] text-red-400/70 shrink-0">
                        {new Date(task.dueDate!.slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task drawer */}
      <TaskDrawer
        task={selectedTask}
        open={showDetail}
        onOpenChange={setShowDetail}
        onSave={handleSave}
        onDelete={(id) => handleDelete(id)}
        onToggleSubtask={(id, completed) => handleToggle(id, completed)}
        workspaceId={selectedTask?.workspaceId ?? null}
        taskStatuses={taskStatuses}
        projects={projectsForPicker}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  taskStatuses,
  onOpen,
  onToggle,
}: {
  task: Task;
  taskStatuses: TaskStatusDefinition[];
  onOpen: (task: Task) => void;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const done = isTaskStatusTerminal(task.status, taskStatuses);
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted/40 transition-colors group">
      <Checkbox
        checked={done}
        onCheckedChange={(checked) => onToggle(task.id, checked === true)}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
      >
        <span className={cn("text-xs truncate flex-1", done && "line-through text-muted-foreground")}>
          {task.title}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.dueTime ?? "All day"}
        </span>
      </button>
    </div>
  );
}

// ─── AgendaGroup ──────────────────────────────────────────────────────────────

function AgendaGroup({
  label,
  labelClass,
  tasks,
  taskStatuses,
  todayYMD,
  onSelectTask,
  onToggle,
  showDate = false,
}: {
  label: string;
  labelClass?: string;
  tasks: Task[];
  taskStatuses: TaskStatusDefinition[];
  todayYMD: string;
  onSelectTask: (task: Task) => void;
  onToggle: (id: string, completed: boolean) => void;
  showDate?: boolean;
}) {
  return (
    <div>
      <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-2", labelClass ?? "text-muted-foreground")}>
        {label}
      </h3>
      <div className="space-y-1.5">
        {tasks.map((task) => {
          const done = isTaskStatusTerminal(task.status, taskStatuses);
          const isPast = task.dueDate ? task.dueDate.slice(0, 10) < todayYMD : false;
          return (
            <div
              key={task.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/40 transition-colors group"
            >
              <Checkbox
                checked={done}
                onCheckedChange={(checked) => onToggle(task.id, checked === true)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => onSelectTask(task)}
                className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
              >
                <span className={cn(
                  "size-1.5 rounded-full shrink-0",
                  done ? "bg-emerald-400 opacity-50" : PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary",
                )} />
                <span className={cn("text-xs truncate flex-1", done && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                {showDate && task.dueDate && (
                  <span className={cn("text-[10px] shrink-0", isPast ? "text-red-400/70" : "text-muted-foreground")}>
                    {new Date(task.dueDate.slice(0, 10) + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
                {task.dueTime && (
                  <span className="text-[10px] text-muted-foreground shrink-0">{task.dueTime}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
