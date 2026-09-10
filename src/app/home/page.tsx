"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, CalendarDays, ListChecks } from "lucide-react";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useMeTasksQuery, useQuickAddTaskMutation } from "@/hooks/useMeTasks";
import { groupMeTasksByDate } from "@/lib/me-grouping";
import { localDateStr, relativeDate, greeting, todayLabel } from "@/lib/date-utils";
import type { MeTask, MeTasksLens } from "@/lib/api/me-api";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

const QUICKADD_WS_KEY = "tasky_quickadd_ws";

function TaskRow({ task }: { task: MeTask }) {
  const done = task.canonicalBucket === "done";
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/50 bg-card hover:bg-[var(--nav-hover)] transition-colors">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: task.statusColor ?? "var(--muted-foreground)" }}
        aria-hidden
      />
      <span className={cn("flex-1 min-w-0 truncate text-sm", done && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      {/* Rows group by canonical bucket but keep their workspace's own status
          wording, so a team's "In Review" reads as itself (§6.1). */}
      {task.statusName && (
        <span
          className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground max-w-[7rem] truncate"
          style={{
            borderColor: task.statusColor ?? "var(--border)",
            color: task.statusColor ?? undefined,
          }}
          title={task.statusName}
        >
          {task.statusName}
        </span>
      )}
      {task.priority && (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          {task.priority}
        </span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground max-w-[8rem] truncate" title={task.workspace.name}>
        {task.workspace.name}
      </span>
      {task.dueDate && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {relativeDate(task.dueDate.slice(0, 10))}
        </span>
      )}
    </div>
  );
}

function Section({ title, tasks }: { title: string; tasks: MeTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-1.5">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        <span className="tabular-nums text-muted-foreground/70">{tasks.length}</span>
      </h2>
      <div className="space-y-1">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { workspaces, currentWorkspace } = useWorkspace();
  const [lens, setLens] = useState<MeTasksLens>("list");
  const [title, setTitle] = useState("");

  const personalWs = useMemo(
    () => workspaces.find((w) => w.isPersonal) ?? workspaces[0] ?? null,
    [workspaces],
  );
  const [targetWs, setTargetWs] = useState<string>(() => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(QUICKADD_WS_KEY);
      if (stored) return stored;
    }
    return "";
  });
  // Quick-add target precedence (docs/task-model-and-rollup.md §6.2):
  //   1. an explicit pick, remembered from the last quick-add
  //   2. the active workspace context — arriving at Home from a team board
  //      should keep adding to that board, not silently divert to personal
  //   3. the personal workspace, which is the default home for triage
  const isMember = (id: string | undefined | null) =>
    !!id && workspaces.some((w) => w.id === id);
  const effectiveTarget =
    (isMember(targetWs)
      ? targetWs
      : isMember(currentWorkspace?.id)
        ? currentWorkspace!.id
        : personalWs?.id) ?? "";

  const today = localDateStr(new Date());
  const params = useMemo(() => {
    if (lens === "calendar") {
      const end = new Date();
      end.setDate(end.getDate() + 30);
      return { lens: "calendar" as const, dueAfter: today, dueBefore: localDateStr(end), limit: 500 };
    }
    return { lens: "list" as const, limit: 500 };
  }, [lens, today]);

  const { data, isLoading, isError } = useMeTasksQuery(params);
  const quickAdd = useQuickAddTaskMutation({
    onSuccess: () => {
      setTitle("");
      toast.success("Task added");
    },
    onError: (e) => toast.error(e.message || "Could not add task"),
  });

  const tasks = data?.tasks ?? [];
  const actionable = useMemo(
    () => tasks.filter((t) => t.canonicalBucket !== "done"),
    [tasks],
  );
  const groups = useMemo(() => groupMeTasksByDate(actionable, today), [actionable, today]);

  // Calendar lens: dated actionable tasks grouped by day.
  const byDay = useMemo(() => {
    const map = new Map<string, MeTask[]>();
    for (const t of actionable) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      (map.get(key) ?? map.set(key, []).get(key)!).push(t);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [actionable]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || quickAdd.isPending) return;
    quickAdd.mutate({
      title: trimmed,
      ...(effectiveTarget ? { workspaceId: effectiveTarget } : {}),
    });
  };

  const onTargetChange = (id: string) => {
    setTargetWs(id);
    try {
      localStorage.setItem(QUICKADD_WS_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{greeting()}</h1>
        <p className="text-sm text-muted-foreground">{todayLabel()} · your tasks across every workspace</p>
      </header>

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          aria-label="Task title"
          className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={effectiveTarget}
          onChange={(e) => onTargetChange(e.target.value)}
          aria-label="Target workspace"
          className="h-9 px-2 rounded-md border border-border bg-background text-sm text-muted-foreground max-w-[10rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.isPersonal ? "Personal" : w.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!title.trim() || quickAdd.isPending} className="gap-1.5">
          {quickAdd.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </form>

      {/* Lens toggle */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setLens("list")}
          aria-pressed={lens === "list"}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors cursor-pointer",
            lens === "list" ? "bg-[var(--nav-active-bg)] text-primary font-medium" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ListChecks className="size-4" /> List
        </button>
        <button
          type="button"
          onClick={() => setLens("calendar")}
          aria-pressed={lens === "calendar"}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm transition-colors cursor-pointer",
            lens === "calendar" ? "bg-[var(--nav-active-bg)] text-primary font-medium" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarDays className="size-4" /> Calendar
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2" aria-busy>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 rounded-md bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Couldn’t load your tasks. Please try again.</p>
      ) : lens === "list" ? (
        actionable.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Nothing on your plate. Add a task above to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Overdue" tasks={groups.overdue} />
            <Section title="Today" tasks={groups.today} />
            <Section title="Upcoming" tasks={groups.upcoming} />
            <Section title="No date" tasks={groups.noDate} />
          </div>
        )
      ) : byDay.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tasks due in the next 30 days.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This lens only covers dated work from today onwards. Overdue and undated tasks are on the List lens.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {byDay.map(([day, dayTasks]) => (
            <Section key={day} title={relativeDate(day)} tasks={dayTasks} />
          ))}
        </div>
      )}
    </div>
  );
}
