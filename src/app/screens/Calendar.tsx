"use client";

import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Task } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTasksQuery } from "@/app/hooks/useTasksApi";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-orange-400",
  low: "bg-gray-400",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function Calendar() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(now));

  // Fetch tasks (up to 200) so we can show due dates
  const { data: page } = useTasksQuery(workspaceId, { limit: 200 });
  const allTasks = page?.tasks ?? [];

  // Group tasks by due date key YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of allTasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [allTasks]);

  const handlePrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const todayYMD = toYMD(now);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  const upcomingTasks = allTasks
    .filter((t) => t.dueDate && t.status !== "completed" && t.dueDate.slice(0, 10) > todayYMD)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 8);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tasks with due dates shown on the calendar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{MONTH_NAMES[viewMonth]} {viewYear}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev} aria-label="Previous month">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                    setSelectedDate(todayYMD);
                  }}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext} aria-label="Next month">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
                const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTasks = tasksByDate.get(ymd) ?? [];
                const isToday = ymd === todayYMD;
                const isSelected = ymd === selectedDate;
                return (
                  <button
                    key={ymd}
                    onClick={() => setSelectedDate(ymd)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-start pt-1 pb-0.5 rounded-lg text-sm transition-colors",
                      isSelected && "bg-primary text-primary-foreground",
                      isToday && !isSelected && "ring-2 ring-primary ring-offset-1",
                      !isSelected && "hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    <span className="font-medium leading-none text-xs">{day}</span>
                    {dayTasks.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayTasks.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "size-1.5 rounded-full",
                              t.status === "completed"
                                ? "bg-emerald-400"
                                : PRIORITY_DOT[t.priority ?? ""] ?? "bg-blue-400"
                            )}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className={cn(
                            "text-[8px] leading-none",
                            isSelected ? "text-primary-foreground/70" : "text-gray-400"
                          )}>
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected day tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="size-4" />
                {selectedDate === todayYMD
                  ? "Today"
                  : new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                    })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks due this day</p>
              ) : (
                selectedTasks.map((task) => (
                  <div key={task.id} className="flex gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={cn(
                      "w-1 rounded-full flex-shrink-0",
                      task.status === "completed"
                        ? "bg-emerald-400"
                        : PRIORITY_DOT[task.priority ?? ""] ?? "bg-blue-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        task.status === "completed" && "line-through text-gray-400"
                      )}>
                        {task.title}
                      </p>
                      {task.priority && task.status !== "completed" && (
                        <Badge variant="secondary" className={cn("text-[10px] mt-0.5", PRIORITY_BADGE[task.priority])}>
                          <Flag className="size-2.5 mr-1" />
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
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
                        {new Date(task.dueDate! + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short", day: "numeric",
                        })}
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
