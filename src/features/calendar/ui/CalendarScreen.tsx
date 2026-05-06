"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";
import { DAY_LABELS, MONTH_NAMES, PRIORITY_DOT, useCalendarScreen } from "../hooks/useCalendarScreen";

export function CalendarScreen() {
  const {
    now,
    viewYear, viewMonth,
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
    upcomingLabel,
    taskStatuses,
    quickAddTitle, setQuickAddTitle,
    showQuickAdd, setShowQuickAdd,
    handleAddTaskOnDate,
    createMutation,
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

  // Split selected tasks: incomplete first, completed after
  const incompleteTasks = selectedTasks.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
  const completedTasks  = selectedTasks.filter((t) =>  isTaskStatusTerminal(t.status, taskStatuses));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Month grid */}
        <div className="lg:col-span-2">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePrev} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDate(todayYMD); }}
              >
                Today
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleNext} aria-label="Next month">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Cells — always 6 rows so height never shifts */}
          <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="bg-background aspect-square" />;

              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayTasks    = tasksByDate.get(ymd) ?? [];
              const dayExternal = externalByDate.get(ymd) ?? [];
              const isToday    = ymd === todayYMD;
              const isSelected = ymd === selectedDate;
              const isPast     = ymd < todayYMD;

              const activeTasks    = dayTasks.filter((t) => !isTaskStatusTerminal(t.status, taskStatuses));
              const completedCount = dayTasks.length - activeTasks.length;
              const hasOverdue     = isPast && activeTasks.length > 0;

              // Dot budget: up to 2 active task dots + 1 external + 1 completed indicator
              const activeDots    = activeTasks.slice(0, 2);
              const externalDots  = dayExternal.slice(0, 1);
              const extraCount    = activeTasks.length - activeDots.length + (dayExternal.length - externalDots.length);

              return (
                <button
                  key={ymd}
                  onClick={() => setSelectedDate(ymd)}
                  className={cn(
                    "bg-background aspect-square flex flex-col items-center justify-between pt-1.5 pb-1.5 transition-colors text-sm relative",
                    isSelected && "bg-primary text-primary-foreground",
                    isToday && !isSelected && "ring-inset ring-1 ring-primary",
                    hasOverdue && !isSelected && "bg-red-500/5",
                    !isSelected && "hover:bg-muted/50",
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-medium leading-none",
                    isToday && !isSelected && "text-primary",
                    isPast && !isSelected && !isToday && "text-muted-foreground/60",
                  )}>
                    {day}
                  </span>

                  <div className="flex gap-0.5 flex-wrap justify-center items-center">
                    {activeDots.map((t) => (
                      <span
                        key={t.id}
                        className={cn(
                          "size-1 rounded-full",
                          PRIORITY_DOT[t.priority ?? ""] ?? "bg-primary",
                          isSelected && "opacity-80",
                        )}
                      />
                    ))}
                    {completedCount > 0 && (
                      <span className={cn(
                        "size-1 rounded-full bg-emerald-400",
                        isSelected ? "opacity-60" : "opacity-40",
                      )} />
                    )}
                    {externalDots.map((ev) => (
                      <span
                        key={ev.id}
                        className={cn(
                          "size-1 rounded-full",
                          ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500",
                          isSelected && "opacity-80",
                        )}
                      />
                    ))}
                    {extraCount > 0 && (
                      <span className={cn(
                        "text-[7px] leading-none",
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}>
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-red-400" />High</div>
            <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-orange-400" />Medium</div>
            <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gray-400" />Low</div>
            <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400 opacity-50" />Done</div>
            <div className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-blue-500" />External</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">

          {/* Selected day */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedLabel}
              </h3>
              <button
                type="button"
                onClick={() => { setShowQuickAdd((v) => !v); }}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Add task on this date"
              >
                {showQuickAdd ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              </button>
            </div>

            {/* Quick-add input */}
            {showQuickAdd && (
              <div className="flex gap-1.5 mb-2.5">
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
                  className="flex-1 h-8 px-2.5 text-xs bg-muted/40 border border-border/60 rounded-lg outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
                />
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleAddTaskOnDate}
                  disabled={!quickAddTitle.trim() || createMutation.isPending}
                >
                  Add
                </Button>
              </div>
            )}

            {selectedTasks.length === 0 && selectedExternalEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks or events — click + to add one.</p>
            ) : (
              <div className="space-y-1.5">
                {/* Incomplete tasks first */}
                {incompleteTasks.map((task) => (
                  <TaskRow key={task.id} task={task} taskStatuses={taskStatuses} />
                ))}

                {/* External events */}
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
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Completed tasks last, visually separated */}
                {completedTasks.length > 0 && (
                  <>
                    {incompleteTasks.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/50 pt-1 pl-1">Completed</p>
                    )}
                    {completedTasks.map((task) => (
                      <TaskRow key={task.id} task={task} taskStatuses={taskStatuses} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Upcoming / month tasks */}
          {upcomingLabel && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                {upcomingLabel}
              </h3>
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No open tasks this {MONTH_NAMES[viewMonth].toLowerCase()}. Add a due date to a task to see it here.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card">
                      <span className={cn("size-1.5 rounded-full shrink-0", PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary")} />
                      <span className="text-xs truncate flex-1">{task.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(task.dueDate! + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Task row ─────────────────────────────────────────────────────────────────

import type { Task, TaskStatusDefinition } from "@/lib/types";

function TaskRow({ task, taskStatuses }: { task: Task; taskStatuses: TaskStatusDefinition[] }) {
  const done = isTaskStatusTerminal(task.status, taskStatuses);
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card">
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          done ? "bg-emerald-400" : PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary",
          done && "opacity-50",
        )}
      />
      <span className={cn("text-xs truncate flex-1", done && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {task.dueTime ?? "All day"}
      </span>
    </div>
  );
}
