"use client";

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { DAY_LABELS, MONTH_NAMES, PRIORITY_DOT, useCalendarScreen } from "../hooks/useCalendarScreen";

export function CalendarScreen() {
  const {
    now,
    viewYear,
    viewMonth,
    selectedDate,
    setSelectedDate,
    handlePrev,
    handleNext,
    setViewYear,
    setViewMonth,
    todayYMD,
    cells,
    tasksByDate,
    externalByDate,
    selectedTasks,
    selectedExternalEvents,
    upcomingTasks,
  } = useCalendarScreen();

  const selectedLabel =
    selectedDate === todayYMD
      ? "Today"
      : new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid — no Card wrapper */}
        <div className="lg:col-span-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePrev} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
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
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="bg-background aspect-square" />;
              const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayTasks = tasksByDate.get(ymd) ?? [];
              const dayExternal = externalByDate.get(ymd) ?? [];
              const isToday = ymd === todayYMD;
              const isSelected = ymd === selectedDate;
              const totalDots = dayTasks.length + dayExternal.length;
              return (
                <button
                  key={ymd}
                  data-date={ymd}
                  onClick={() => setSelectedDate(ymd)}
                  className={cn(
                    "bg-background aspect-square flex flex-col items-center justify-between pt-1.5 pb-1.5 transition-colors text-sm",
                    isSelected && "bg-primary text-primary-foreground",
                    isToday && !isSelected && "ring-inset ring-1 ring-primary",
                    !isSelected && "hover:bg-muted/50",
                  )}
                >
                  <span className={cn("text-[11px] font-medium leading-none", isToday && !isSelected && "text-primary")}>{day}</span>
                  {totalDots > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayTasks.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className={cn(
                            "size-1 rounded-full",
                            t.status === "completed" ? "bg-emerald-400" : PRIORITY_DOT[t.priority ?? ""] ?? "bg-primary",
                            isSelected && "opacity-80",
                          )}
                        />
                      ))}
                      {dayExternal.slice(0, 1).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            "size-1 rounded-full",
                            ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500",
                            isSelected && "opacity-80",
                          )}
                        />
                      ))}
                      {totalDots > 3 && (
                        <span className={cn("text-[7px] leading-none", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          +{totalDots - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — no Card wrappers */}
        <div className="space-y-5">
          {/* Selected day events */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              {selectedLabel}
            </h3>
            {selectedTasks.length === 0 && selectedExternalEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks or events this day</p>
            ) : (
              <div className="space-y-1.5">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        task.status === "completed" ? "bg-emerald-400" : PRIORITY_DOT[task.priority ?? ""] ?? "bg-primary",
                      )}
                    />
                    <span className={cn("text-xs truncate flex-1", task.status === "completed" && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {task.dueTime ?? ""}
                      </span>
                    )}
                  </div>
                ))}
                {selectedExternalEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card">
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500",
                      )}
                    />
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
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Upcoming
            </h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming tasks</p>
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
        </div>
      </div>
    </div>
  );
}
