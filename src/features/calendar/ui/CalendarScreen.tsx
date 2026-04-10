"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ExternalLink, Flag } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";
import { DAY_LABELS, MONTH_NAMES, PRIORITY_BADGE, PRIORITY_DOT, useCalendarScreen } from "../hooks/useCalendarScreen";

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

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400">Tasks with due dates shown on the calendar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{MONTH_NAMES[viewMonth]} {viewYear}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev} aria-label="Previous month"><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDate(todayYMD); }}>Today</Button>
                <Button variant="outline" size="sm" onClick={handleNext} aria-label="Next month"><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{d}</div>)}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
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
                      "aspect-square flex flex-col items-center justify-start pt-1 pb-0.5 rounded-lg text-sm transition-colors",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "ring-2 ring-primary ring-offset-1",
                      !isSelected && "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="font-medium leading-none text-xs">{day}</span>
                    {totalDots > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayTasks.slice(0, 2).map((t) => (
                          <span key={t.id} className={cn("size-1.5 rounded-full", t.status === "completed" ? "bg-emerald-400" : PRIORITY_DOT[t.priority ?? ""] ?? "bg-blue-400")} />
                        ))}
                        {dayExternal.slice(0, 1).map((ev) => (
                          <span key={ev.id} className={cn("size-1.5 rounded-full", ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500")} />
                        ))}
                        {totalDots > 3 && <span className={cn("text-[8px] leading-none", isSelected ? "text-primary-foreground/70" : "text-gray-400")}>+{totalDots - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="size-4" />
                {selectedDate === todayYMD
                  ? "Today"
                  : new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedTasks.length === 0 && selectedExternalEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks or events this day</p>
              ) : (
                <>
                  {selectedTasks.map((task) => (
                    <div key={task.id} className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className={cn("w-1 rounded-full flex-shrink-0", task.status === "completed" ? "bg-emerald-400" : PRIORITY_DOT[task.priority ?? ""] ?? "bg-blue-400")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", task.status === "completed" && "line-through text-gray-400")}>{task.title}</p>
                        {task.priority && task.status !== "completed" && (
                          <Badge variant="secondary" className={cn("text-[10px] mt-0.5", PRIORITY_BADGE[task.priority])}>
                            <Flag className="size-2.5 mr-1" />
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedExternalEvents.map((ev) => (
                    <div key={ev.id} className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className={cn("w-1 rounded-full flex-shrink-0", ev.provider === "google" ? "bg-blue-500" : "bg-cyan-500")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {ev.provider === "google" ? "Google" : "Microsoft"}
                          </Badge>
                          {!ev.allDay && (
                            <span className="text-xs text-muted-foreground">
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
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Upcoming</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming tasks with due dates</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={cn("w-1 rounded-full flex-shrink-0", PRIORITY_DOT[task.priority ?? ""] ?? "bg-blue-400")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(task.dueDate! + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
