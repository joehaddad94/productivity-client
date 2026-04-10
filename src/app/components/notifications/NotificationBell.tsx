"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X, CalendarClock, AlertCircle, Calendar } from "lucide-react";
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

const TYPE_CONFIG: Record<AppNotification["type"], { icon: React.ElementType; color: string }> = {
  due_today: { icon: CalendarClock, color: "text-amber-500" },
  overdue: { icon: AlertCircle, color: "text-destructive" },
  daily_agenda: { icon: Calendar, color: "text-primary" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const { data: notifications = [] } = useNotificationsQuery(workspaceId);
  const { data: unreadCount = 0 } = useUnreadCountQuery(workspaceId);
  const markRead = useMarkReadMutation(workspaceId);
  const markAllRead = useMarkAllReadMutation(workspaceId);
  const dismiss = useDismissMutation(workspaceId);
  const dismissAll = useDismissAllMutation(workspaceId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    setOpen((v) => !v);
  }

  function handleMarkRead(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md relative"
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
            "absolute right-0 top-10 z-50 w-80 rounded-xl overflow-hidden",
            "bg-card border border-border",
            "shadow-lg"
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
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="size-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => dismissAll.mutate()}
                  title="Clear all"
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Bell className="size-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.daily_agenda;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition-colors",
                      n.read
                        ? "hover:bg-accent/50"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className={cn("mt-0.5 flex-shrink-0", cfg.color)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-xs font-medium leading-snug", !n.read && "font-semibold")}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss.mutate(n.id); }}
                          className="flex-shrink-0 p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
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
                        {!n.read && (
                          <span className="size-1.5 rounded-full bg-primary" aria-label="unread" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
