import type { MeTask } from "@/lib/api/me-api";

export interface MeTaskGroups {
  overdue: MeTask[];
  today: MeTask[];
  upcoming: MeTask[];
  noDate: MeTask[];
}

/**
 * Bucket rollup tasks for the List lens by due date relative to `todayStr`
 * (a local YYYY-MM-DD string). Comparison is lexicographic on the date part,
 * which is correct for the YYYY-MM-DD format. Tasks are assumed pre-filtered
 * by the caller (e.g. done tasks removed).
 */
export function groupMeTasksByDate(
  tasks: MeTask[],
  todayStr: string,
): MeTaskGroups {
  const groups: MeTaskGroups = {
    overdue: [],
    today: [],
    upcoming: [],
    noDate: [],
  };
  for (const t of tasks) {
    const due = t.dueDate ? t.dueDate.slice(0, 10) : null;
    if (!due) groups.noDate.push(t);
    else if (due < todayStr) groups.overdue.push(t);
    else if (due === todayStr) groups.today.push(t);
    else groups.upcoming.push(t);
  }
  return groups;
}
