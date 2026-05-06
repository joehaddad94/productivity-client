"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, X, CalendarClock, AlertCircle, Calendar, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/app/components/ui/utils";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDismissMutation,
  useDismissAllMutation,
} from "@/app/hooks/useNotificationsApi";
import type { AppNotification } from "@/lib/types";

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  due_today:      { icon: CalendarClock, color: "text-amber-500"   },
  overdue:        { icon: AlertCircle,   color: "text-destructive"  },
  daily_agenda:   { icon: Calendar,      color: "text-primary"      },
  task_completed: { icon: CheckSquare,   color: "text-green-500"    },
};

const DEFAULT_CONFIG = TYPE_CONFIG.daily_agenda;

function notificationHref(n: AppNotification): string {
  if (n.taskId && (n.type === "due_today" || n.type === "overdue" || n.type === "task_completed")) {
    return "/tasks";
  }
  return "/dashboard";
}

function NotificationBellComponent() {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [openToRight, setOpenToRight] = useState(false);
  const [take, setTake]           = useState(PAGE_SIZE);
  const [confirmClear, setConfirmClear] = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  // Always fetch (pre-loads on mount), only auto-refetch while panel is open
  const { data, isLoading } = useNotificationsQuery(workspaceId, {
    skip: 0,
    take,
    refetchWhenOpen: open,
  });
  const notifications = data?.items ?? [];
  const total         = data?.total ?? 0;
  const hasMore       = notifications.length < total;

  const { data: unreadCount = 0 } = useUnreadCountQuery(workspaceId);
  const markRead    = useMarkReadMutation(workspaceId);
  const markAllRead = useMarkAllReadMutation(workspaceId);
  const dismiss     = useDismissMutation(workspaceId);
  const dismissAll  = useDismissAllMutation(workspaceId);

  // Reset take and confirmClear when panel closes
  useEffect(() => {
    if (!open) {
      setTake(PAGE_SIZE);
      setConfirmClear(false);
    }
  }, [open]);

  // Auto-cancel confirm-clear after 3 s of inactivity
  useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  // document.title unread badge — separate cleanup effect avoids mid-render flash
  useEffect(() => {
    document.title = (!open && unreadCount > 0) ? `(${unreadCount}) Tasky` : "Tasky";
  }, [unreadCount, open]);
  useEffect(() => () => { document.title = "Tasky"; }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Smart positioning
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setOpenUpward(window.innerHeight - rect.bottom < 360 && rect.top > window.innerHeight - rect.bottom);
    setOpenToRight(window.innerWidth - rect.right >= 320 || window.innerWidth - rect.right > rect.left);
  }, [open]);

  function handleMarkRead(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
  }

  function handleNotificationClick(n: AppNotification) {
    handleMarkRead(n);
    setOpen(false);
    router.push(notificationHref(n));
  }

  function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    dismiss.mutate(id);
  }

  function handleDismissAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    dismissAll.mutate(undefined, {
      onSuccess: () => setTake(PAGE_SIZE),
    });
    setConfirmClear(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md relative cursor-pointer"
        data-testid="notification-bell"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[9px] font-bold"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute z-50 w-80 rounded-xl overflow-hidden",
            openUpward ? "bottom-full mb-2" : "top-10",
            openToRight ? "left-0" : "right-0",
            "bg-card border border-border shadow-lg",
          )}
          data-testid="notification-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  title="Mark all as read"
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <CheckCheck className="size-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  title={confirmClear ? "Click again to confirm" : "Clear all"}
                  className={cn(
                    "p-1 rounded-md transition-colors cursor-pointer text-muted-foreground",
                    confirmClear
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "hover:bg-accent hover:text-destructive",
                  )}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Confirm-clear banner */}
          {confirmClear && (
            <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
              <p className="text-xs text-destructive text-center">Click the trash icon again to clear all</p>
            </div>
          )}

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Bell className="size-8 opacity-30 animate-pulse" />
                <p className="text-sm">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Bell className="size-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_CONFIG;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "flex gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors",
                        n.read ? "hover:bg-accent/50" : "bg-primary/5 hover:bg-primary/10",
                      )}
                    >
                      <div className={cn("mt-0.5 flex-shrink-0", cfg.color)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs leading-snug", !n.read ? "font-semibold" : "font-medium")}>
                            {n.title}
                          </p>
                          <button
                            onClick={(e) => handleDismiss(e, n.id)}
                            className="flex-shrink-0 p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Dismiss"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                          {!n.read && <span className="size-1.5 rounded-full bg-primary" aria-label="unread" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setTake((t) => t + PAGE_SIZE)}
                    disabled={isLoading}
                    className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors border-t border-border cursor-pointer disabled:cursor-default"
                  >
                    {isLoading ? "Loading…" : `Load more (${total - notifications.length} remaining)`}
                  </button>
                )}
              </>
            )}
          </div>

          {notifications.length > 0 && unreadCount === 0 && (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">All caught up</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const NotificationBell = memo(NotificationBellComponent);
