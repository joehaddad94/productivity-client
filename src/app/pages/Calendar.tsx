import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

const events = [
  { id: "1", title: "Team Standup", time: "9:00 AM", date: "Feb 26", color: "bg-primary" },
  { id: "2", title: "Client Meeting", time: "2:00 PM", date: "Feb 26", color: "bg-purple-500" },
  { id: "3", title: "Design Review", time: "4:30 PM", date: "Feb 26", color: "bg-green-500" },
  { id: "4", title: "Project Planning", time: "10:00 AM", date: "Feb 27", color: "bg-orange-500" },
];

export function Calendar() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentMonth = "February 2026";
  
  // Generate calendar days (simplified)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2; // Start from day -2 to show previous month
    return day > 0 && day <= 28 ? day : null;
  });

  const todayEvents = events.filter((e) => e.date === "Feb 26");
  const upcomingEvents = events.filter((e) => e.date !== "Feb 26");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your schedule and events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentMonth}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm
                    ${day === 26
                      ? "bg-primary text-primary-foreground font-bold"
                      : day
                      ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      : "text-gray-300 dark:text-gray-700"
                    }
                  `}
                >
                  {day}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className={`w-1 rounded-full ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className={`w-1 rounded-full ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {event.date} at {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
