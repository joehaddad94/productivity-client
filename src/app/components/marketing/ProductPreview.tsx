import { CheckSquare, FileText, LayoutDashboard, FolderOpen, BarChart2, CalendarDays, Settings, Play } from "lucide-react";

/**
 * Stylized faux-dashboard preview shown on the landing page.
 * Pure CSS/JSX — no screenshots — so it adapts perfectly to light/dark theme.
 */
export function ProductPreview() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Glow under the preview */}
      <div className="absolute -inset-x-12 -inset-y-8 bg-primary/20 blur-3xl opacity-40 dark:opacity-30 rounded-[40px]" aria-hidden />

      {/* Browser frame */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40">
        {/* Window chrome */}
        <div className="h-8 border-b border-border/60 flex items-center gap-1.5 px-3 bg-muted/40">
          <div className="size-2.5 rounded-full bg-red-400/60" />
          <div className="size-2.5 rounded-full bg-amber-400/60" />
          <div className="size-2.5 rounded-full bg-emerald-400/60" />
          <div className="ml-3 flex-1 h-4 rounded bg-background/60 max-w-[220px]" />
        </div>

        <div className="grid grid-cols-[180px_1fr] min-h-[420px]">
          {/* Sidebar */}
          <div className="border-r border-border/60 bg-muted/20 p-2.5 space-y-0.5">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-tight">Tasky</div>
            <div className="h-7" />
            <SidebarItem icon={<LayoutDashboard className="size-3.5" />} label="Dashboard" active />
            <SidebarItem icon={<CheckSquare className="size-3.5" />} label="Tasks" />
            <SidebarItem icon={<FileText className="size-3.5" />} label="Notes" />
            <SidebarItem icon={<FolderOpen className="size-3.5" />} label="Projects" />
            <SidebarItem icon={<CalendarDays className="size-3.5" />} label="Calendar" />
            <SidebarItem icon={<BarChart2 className="size-3.5" />} label="Analytics" />
            <SidebarItem icon={<Settings className="size-3.5" />} label="Settings" />
          </div>

          {/* Main */}
          <div className="p-5 space-y-4">
            {/* Greeting */}
            <div>
              <div className="text-base font-semibold tracking-tight">Good evening</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">3 tasks due today</div>
            </div>

            {/* Quick add */}
            <div className="h-7 rounded-md bg-muted/40 border border-border/60 flex items-center px-2.5 text-[10px] text-muted-foreground/70">
              Add a task and press Enter…
            </div>

            {/* Today section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Today</span>
                <span className="text-[9px] text-muted-foreground tabular-nums">1/3 done</span>
              </div>
              <div className="h-0.5 w-full bg-muted rounded-full mb-2.5 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "33%" }} />
              </div>
              <div className="space-y-1">
                <TaskRow done title="Review pull request" priority="medium" />
                <TaskRow title="Write blog post draft" priority="high" due="today" />
                <TaskRow title="1:1 with Sarah" priority="medium" due="3 PM" />
              </div>
            </div>

            {/* Bottom row: pomodoro + streak */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111] dark:bg-white text-white dark:text-[#0a0a0a] text-[10px] font-medium">
                <div className="relative">
                  <div className="size-3.5 rounded-full border-2 border-white/20 dark:border-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="size-1.5 fill-current" />
                  </div>
                </div>
                <div className="flex flex-col leading-none gap-0.5">
                  <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-400 dark:text-emerald-600">Focus</span>
                  <span className="font-mono tabular-nums text-[10px]">25:00</span>
                </div>
              </div>
              <div className="flex-1 px-2.5 py-1.5 rounded-lg border border-border/60 flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground flex-1">Streak</span>
                <div className="flex gap-0.5">
                  {[1,1,1,0,1,1,1].map((on, i) => (
                    <div key={i} className={on ? "size-1.5 rounded-full bg-amber-500" : "size-1.5 rounded-full bg-muted"} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold tabular-nums">12d</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] ${active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      {label}
    </div>
  );
}

function TaskRow({ title, priority, due, done }: { title: string; priority: "low" | "medium" | "high"; due?: string; done?: boolean }) {
  const pill =
    priority === "high"   ? "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50" :
    priority === "medium" ? "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50" :
                            "text-gray-500 bg-gray-100 dark:bg-gray-800";
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 group">
      <div className={`size-3 rounded-sm border-[1.5px] ${done ? "bg-primary border-primary" : "border-muted-foreground/40"} shrink-0`} />
      <span className={`text-[11px] flex-1 truncate ${done ? "line-through text-muted-foreground" : ""}`}>{title}</span>
      {due && <span className="text-[9px] text-muted-foreground shrink-0">{due}</span>}
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${pill}`}>
        {priority === "high" ? "H" : priority === "medium" ? "M" : "L"}
      </span>
    </div>
  );
}
