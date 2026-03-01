import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

// Generate sample activity data for the last 12 weeks
function generateActivityData() {
  const weeks = 12;
  const daysPerWeek = 7;
  const data: { date: string; count: number }[] = [];
  
  const today = new Date();
  for (let week = weeks - 1; week >= 0; week--) {
    for (let day = 0; day < daysPerWeek; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + (6 - day)));
      const count = Math.floor(Math.random() * 12);
      data.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }
  }
  
  return data;
}

export function ActivityHeatmap() {
  const activityData = generateActivityData();
  
  // Group by weeks
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count <= 3) return "bg-green-200 dark:bg-green-900";
    if (count <= 6) return "bg-green-400 dark:bg-green-700";
    if (count <= 9) return "bg-green-600 dark:bg-green-500";
    return "bg-green-700 dark:bg-green-400";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-1 overflow-x-auto pb-2">
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
                        {day.count} tasks on {formatDate(day.date)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
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
