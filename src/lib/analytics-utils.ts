/**
 * Shared analytics computation utilities.
 */

/** Score components for the productivity ring (out of 100 total) */
export function computeScoreComponents(
  tasksCompleted: number,
  focusMinutes: number,
  streak: number,
  rangeDays: number,
): { taskScore: number; focusScore: number; streakScore: number } {
  const taskBenchmark  = Math.round(50  * rangeDays / 30);
  const focusBenchmark = Math.round(750 * rangeDays / 30);
  const taskScore   = Math.min(tasksCompleted / taskBenchmark,  1) * 50;
  const focusScore  = Math.min(focusMinutes   / focusBenchmark, 1) * 30;
  const streakScore = Math.min(streak / 7, 1) * 20;
  return { taskScore, focusScore, streakScore };
}

/** Tailwind classes for heatmap cell based on activity count */
export function getHeatmapColor(count: number): string {
  if (count === 0) return "bg-gray-100 dark:bg-gray-800";
  if (count <= 2)  return "bg-green-200 dark:bg-green-900";
  if (count <= 5)  return "bg-green-400 dark:bg-green-700";
  if (count <= 8)  return "bg-green-600 dark:bg-green-500";
  return "bg-green-700 dark:bg-green-400";
}
