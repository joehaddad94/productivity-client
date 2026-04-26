"use client";

import { useState, useCallback, useMemo } from "react";
import { Play, Pause, RotateCcw, SkipForward, ChevronDown, Link2, X, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { usePomodoroTimer, type SessionType } from "./usePomodoroTimer";
import { usePomodoroSettings } from "./usePomodoroSettings";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useLogStatMutation } from "@/app/hooks/useAnalyticsApi";
import { useTasksQuery, useLogTaskFocusMutation } from "@/app/hooks/useTasksApi";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import { cn } from "@/app/components/ui/utils";
import type { TaskStatusDefinition } from "@/lib/types";
import { ensureTaskStatuses, isTaskStatusTerminal } from "@/features/tasks/lib/taskStatusHelpers";

// Session accent colours — emerald/teal/cyan family matching the app primary.
const SESSION: Record<SessionType, { label: string; color: string; bg: string; glow: string }> = {
  work:        { label: "Focus",       color: "#059669", bg: "rgba(5,150,105,0.18)",   glow: "rgba(5,150,105,0.45)"  },
  short_break: { label: "Short Break", color: "#0d9488", bg: "rgba(13,148,136,0.16)",  glow: "rgba(13,148,136,0.40)" },
  long_break:  { label: "Long Break",  color: "#0891b2", bg: "rgba(8,145,178,0.16)",   glow: "rgba(8,145,178,0.40)"  },
};

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

async function askNotificationPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

function fireNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon: "/favicon.ico" }); } catch { /* ignore */ }
}

// ── Mini progress ring (collapsed pill) ─────────────────────────────────────
// Uses stroke="currentColor" so the track colour flips with the text colour class.
function MiniRing({ progress, color }: { progress: number; color: string }) {
  const r = 13;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" style={{ transform: "rotate(-90deg)" }}>
      {/* Inverted: white/10 on dark card (light mode), black/10 on white card (dark mode) */}
      <circle cx="16" cy="16" r={r} fill="none"
        className="text-white/[0.12] dark:text-black/[0.10]"
        stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r={r} fill="none"
        stroke={color} strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ── Shared inverted-card class strings ──────────────────────────────────────
// Light mode → dark card.  Dark mode → light card.
const CARD_BG     = "bg-[#111111] dark:bg-white";
const CARD_BORDER = "border-white/[0.08] dark:border-black/[0.08]";
const HOVER_BG    = "hover:bg-white/[0.07] dark:hover:bg-black/[0.06]";
const FG          = "text-white dark:text-[#0a0a0a]";
const FG_MUTED    = "text-white/50 dark:text-black/50";
const FG_SUBTLE   = "text-white/30 dark:text-black/30";
const DIVIDER     = "bg-white/[0.10] dark:bg-black/[0.10]";

export function PomodoroWidget() {
  const [expanded,   setExpanded]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [linkedId,   setLinkedId]   = useState<string | null>(null);

  const { settings } = usePomodoroSettings();
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id ?? null;
  const logStat      = useLogStatMutation(wsId);
  const logTaskFocus = useLogTaskFocusMutation(wsId);

  const { data: tasksPage }        = useTasksQuery(wsId);
  const { data: rawStatuses = [] } = useTaskStatusesQuery(wsId);
  const statuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(wsId, rawStatuses), [wsId, rawStatuses],
  );
  const tasks      = (tasksPage?.tasks ?? []).filter((t) => !isTaskStatusTerminal(t.status, statuses));
  const linkedTask = tasks.find((t) => t.id === linkedId) ?? null;

  const onComplete = useCallback(async (type: SessionType, focusMinutes: number) => {
    const isWork = type === "work";
    const { label } = SESSION[type];
    if (settings.inAppToasts) {
      toast.success(`${label} session complete!`, {
        description: isWork
          ? `${focusMinutes} min focused${linkedTask ? ` on "${linkedTask.title}"` : ""}. Take a break.`
          : "Break over — time to focus!",
      });
    }
    if (settings.browserNotifications) {
      if (await askNotificationPermission()) {
        fireNotification(
          `${label} complete!`,
          isWork
            ? `${focusMinutes} min focused${linkedTask ? ` on "${linkedTask.title}"` : ""}. Time for a break.`
            : "Break over — ready to focus?",
        );
      }
    }
    if (isWork && focusMinutes > 0 && wsId) {
      logStat.mutate({ focusMinutes });
      if (linkedId) logTaskFocus.mutate({ id: linkedId, minutes: focusMinutes });
    }
  }, [settings, wsId, logStat, logTaskFocus, linkedTask, linkedId]);

  const { state, start, pause, reset, skip } = usePomodoroTimer(settings, onComplete);
  const { sessionType, secondsLeft, isRunning, sessionCount } = state;
  const cfg = SESSION[sessionType];

  const total = sessionType === "work"        ? settings.workMinutes * 60
    : sessionType === "short_break"           ? settings.shortBreakMinutes * 60
    : settings.longBreakMinutes * 60;
  const progress = 1 - secondsLeft / total;

  const R    = 74;
  const circ = 2 * Math.PI * R;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {expanded && (
        <div className={cn("w-[304px] rounded-2xl overflow-hidden border shadow-2xl", CARD_BG, CARD_BORDER)}>

          {/* Session-coloured accent line */}
          <div className="h-[2px] transition-colors duration-500" style={{ background: cfg.color }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
              {isRunning && (
                <span className={cn("flex items-center gap-1 text-[10px] tracking-wide uppercase", FG_MUTED)}>
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className={cn("text-[11px] tabular-nums", FG_SUBTLE)}>{sessionCount} done</span>
              <a href="/settings" onClick={() => setExpanded(false)} title="Focus settings"
                className={cn("transition-colors", FG_SUBTLE, "hover:text-white dark:hover:text-black")}>
                <Settings2 className="size-3.5" />
              </a>
              <button onClick={() => setExpanded(false)}
                className={cn("transition-colors cursor-pointer", FG_SUBTLE, "hover:text-white dark:hover:text-black")}>
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Progress ring — the hero */}
          <div className="flex flex-col items-center pt-5 pb-4 gap-4">
            <div className="relative">
              <svg width={192} height={192} viewBox="0 0 192 192"
                style={{ transform: "rotate(-90deg)" }}>
                {/* Track — inverted: white/8 on dark (light mode), black/8 on white (dark mode) */}
                <circle cx="96" cy="96" r={R} fill="none"
                  className="text-white/[0.10] dark:text-black/[0.08]"
                  stroke="currentColor" strokeWidth="7" />
                {/* Progress arc */}
                <circle cx="96" cy="96" r={R} fill="none"
                  stroke={cfg.color} strokeWidth="7"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - progress)}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-dashoffset 1s linear",
                    filter: `drop-shadow(0 0 10px ${cfg.glow})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className={cn("font-mono text-[3.25rem] font-bold tracking-tight leading-none tabular-nums", FG)}>
                  {fmt(secondsLeft)}
                </span>
                <span className={cn("mt-1.5 text-[10px] uppercase tracking-[0.18em]", FG_SUBTLE)}>
                  {isRunning ? "running" : "paused"}
                </span>
              </div>
            </div>

            {/* Session-cycle dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => {
                const filled = i < sessionCount % settings.sessionsBeforeLongBreak;
                return (
                  <div key={i}
                    className={cn("rounded-full transition-all duration-500", !filled && "bg-white/[0.18] dark:bg-black/[0.14]")}
                    style={filled
                      ? { width: 9, height: 9, background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }
                      : { width: 6, height: 6 }}
                  />
                );
              })}
            </div>
          </div>

          {/* Task link */}
          <div className={cn("mx-4 mb-4 rounded-xl border overflow-visible relative", "bg-white/[0.06] dark:bg-black/[0.05]", CARD_BORDER)}>
            {linkedTask ? (
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <div className="size-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className={cn("flex-1 text-[13px] font-medium truncate", FG)}>{linkedTask.title}</span>
                <button onClick={() => setLinkedId(null)} title="Unlink"
                  className={cn("transition-colors cursor-pointer shrink-0 hover:text-red-400", FG_SUBTLE)}>
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowPicker((v) => !v)}
                  className={cn("w-full flex items-center gap-2.5 px-3.5 py-3 text-[13px] transition-colors cursor-pointer", FG_SUBTLE, "hover:text-white dark:hover:text-black/70")}>
                  <Link2 className="size-3.5 shrink-0" />
                  {tasks.length === 0 ? "No active tasks" : "Link a task to this session…"}
                </button>
                {showPicker && tasks.length > 0 && (
                  <div className={cn("absolute bottom-[calc(100%+6px)] left-0 right-0 z-20 rounded-xl border shadow-xl max-h-48 overflow-y-auto", "bg-[#1c1c1f] dark:bg-[#f5f5f5]", CARD_BORDER)}>
                    {tasks.map((t) => (
                      <button key={t.id}
                        onClick={() => { setLinkedId(t.id); setShowPicker(false); }}
                        className={cn("w-full text-left text-[13px] px-4 py-2.5 truncate transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl", FG_MUTED, "hover:text-white dark:hover:text-black hover:bg-white/[0.08] dark:hover:bg-black/[0.06]")}>
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className={cn("flex items-center justify-between px-5 py-4 border-t", CARD_BORDER)}>
            <button onClick={reset} aria-label="Reset" title="Reset"
              className={cn("size-10 flex items-center justify-center rounded-xl transition-all cursor-pointer", FG_SUBTLE, HOVER_BG, "hover:text-white dark:hover:text-black")}>
              <RotateCcw className="size-[17px]" />
            </button>

            <button
              onClick={isRunning ? pause : start}
              aria-label={isRunning ? "Pause" : "Start"}
              className="size-[60px] flex items-center justify-center rounded-2xl transition-all active:scale-[0.93] hover:brightness-110 cursor-pointer"
              style={{ background: cfg.color, boxShadow: `0 6px 24px ${cfg.glow}, 0 0 0 1px rgba(255,255,255,0.1) inset` }}
            >
              {isRunning
                ? <Pause className="size-[22px] text-white" />
                : <Play  className="size-[22px] text-white ml-0.5" />
              }
            </button>

            <button onClick={skip} aria-label="Skip" title="Skip session"
              className={cn("size-10 flex items-center justify-center rounded-xl transition-all cursor-pointer", FG_SUBTLE, HOVER_BG, "hover:text-white dark:hover:text-black")}>
              <SkipForward className="size-[17px]" />
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsed pill ──────────────────────────────────────────────── */}
      <div className={cn("flex items-center rounded-2xl overflow-hidden h-[52px] border shadow-xl", CARD_BG, CARD_BORDER)}>

        {/* Left: ring + label + time → click to expand */}
        <button
          onClick={() => setExpanded((p) => !p)}
          aria-label="Toggle timer"
          className={cn("flex items-center gap-3 pl-3.5 pr-3 h-full transition-colors cursor-pointer rounded-l-2xl", HOVER_BG)}
        >
          <div className="relative shrink-0">
            <MiniRing progress={progress} color={cfg.color} />
            <div className="absolute inset-0 flex items-center justify-center">
              {isRunning
                ? <span className="size-[5px] rounded-full animate-pulse" style={{ background: cfg.color }} />
                : <span className="size-[5px] rounded-full bg-white/20 dark:bg-black/20" />
              }
            </div>
          </div>

          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] mb-[3px]" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className={cn("font-mono text-[15px] font-bold tabular-nums tracking-tight", FG)}>
              {fmt(secondsLeft)}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className={cn("w-px h-[26px] shrink-0", DIVIDER)} />

        {/* Inline play/pause */}
        <button
          onClick={isRunning ? pause : start}
          aria-label={isRunning ? "Pause" : "Start"}
          className={cn("flex items-center justify-center w-12 h-full transition-colors cursor-pointer rounded-r-2xl", HOVER_BG)}
        >
          {isRunning
            ? <Pause className={cn("size-4", FG_MUTED)} />
            : <Play  className={cn("size-4 ml-0.5", FG_MUTED)} />
          }
        </button>
      </div>

    </div>
  );
}
