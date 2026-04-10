import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ActivityDay {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data?: ActivityDay[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS = 16;

function buildGrid(data: ActivityDay[]): ActivityDay[][] {
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();
  // Align to last Sunday
  const dayOfWeek = today.getDay();
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() - dayOfWeek);

  const weeks: ActivityDay[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const week: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(endSunday);
      date.setDate(endSunday.getDate() - w * 7 + d);
      const iso = date.toISOString().split("T")[0];
      week.push({ date: iso, count: byDate.get(iso) ?? 0 });
    }
    weeks.push(week);
  }
  return weeks;
}

function getColor(count: number) {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2) return "bg-green-200 dark:bg-green-900";
  if (count <= 5) return "bg-green-400 dark:bg-green-700";
  if (count <= 8) return "bg-green-600 dark:bg-green-500";
  return "bg-green-700 dark:bg-green-400";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const weeks = buildGrid(data ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 pt-0">
            {DAYS_OF_WEEK.map((day, i) => (
              <div
                key={day}
                className={`size-3 flex items-center text-[8px] text-gray-400 dark:text-gray-600 leading-none ${
                  i % 2 === 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <TooltipProvider>
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`size-3 rounded-sm ${getColor(day.count)} transition-all hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500 cursor-pointer`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {day.count} task{day.count !== 1 ? "s" : ""} on {formatDate(day.date)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="size-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="size-3 rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="size-3 rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="size-3 rounded-sm bg-green-600 dark:bg-green-500" />
            <div className="size-3 rounded-sm bg-green-700 dark:bg-green-400" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
