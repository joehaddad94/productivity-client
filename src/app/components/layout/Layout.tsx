"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun, LogOut, Loader2, Bug, Shield } from "lucide-react";
import { ReportBugSheet } from "@/app/components/ReportBugSheet";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { useLayout } from "./useLayout";
import { NAV_ITEMS } from "./types";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Button } from "../ui/button";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { PomodoroWidget } from "@/app/components/pomodoro";
import { CreateFirstWorkspace } from "@/app/screens/workspace/CreateFirstWorkspace";
import { useAdminBugReportsStatsQuery } from "@/app/hooks/useBugReportsApi";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [previewMode, setPreviewMode] = useState<"auth" | "skeleton" | null>(null);
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const {
    showSidebar,
    redirectingToWorkspace,
    hasWorkspaces,
    isFetched,
    setCurrentWorkspaceId,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    activePath,
    theme,
    toggleTheme,
    handleLogout,
    user,
    isLoggingOut,
  } = useLayout();

  const { data: bugStats, isPending: bugStatsPending } = useAdminBugReportsStatsQuery({
    enabled: Boolean(user?.isAdmin && showSidebar),
    staleTime: 45_000,
  });
  const rawOpen = bugStats?.byStatus?.open;
  const openBugCount =
    typeof rawOpen === "number"
      ? rawOpen
      : typeof rawOpen === "string" && Number.isFinite(Number(rawOpen))
        ? Number(rawOpen)
        : 0;

  const initials =
    user?.name?.trim()
      ? user.name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const previewOverlay = previewMode ? (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {previewMode === "auth" ? (
        <div className="absolute inset-0">
          <ScreenLoader variant="auth" message="Checking authentication…" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto pt-12">
          <ScreenSkeleton />
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-4 right-4 z-[101]"
        onClick={() => setPreviewMode(null)}
      >
        Close preview
      </Button>
    </div>
  ) : null;

  // Auth routes: full screen
  if (!showSidebar) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <main className="min-h-screen flex flex-col">
            <div className="flex-1 min-h-0">{children}</div>
          </main>
        </div>
        {previewOverlay}
      </>
    );
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-12 flex items-center px-4">
        <span className="text-sm font-semibold tracking-tight">Tasky</span>
      </div>

      {/* Workspace switcher */}
      <div className="px-2 pb-2">
        <WorkspaceSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/dashboard"
              ? activePath === "/dashboard"
              : activePath?.startsWith(item.path) ?? false;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeSidebar}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-[var(--nav-active-bg)] text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {user?.isAdmin && (
          <Link
            href="/admin/bugs"
            onClick={closeSidebar}
            aria-current={activePath?.startsWith("/admin/bugs") ? "page" : undefined}
            aria-label={`Bug triage, ${openBugCount} open`}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
              activePath?.startsWith("/admin/bugs")
                ? "bg-[var(--nav-active-bg)] text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-[var(--nav-hover)]",
            )}
          >
            <Shield className={cn("size-[18px] shrink-0", activePath?.startsWith("/admin/bugs") ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1 min-w-0">Bug triage</span>
            {bugStatsPending ? (
              <span
                className="size-5 shrink-0 rounded-md bg-muted/70 animate-pulse"
                aria-hidden
              />
            ) : (
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 min-w-5 shrink-0 justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums",
                  openBugCount > 0
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                {openBugCount}
              </Badge>
            )}
          </Link>
        )}
      </nav>

      {/* User + logout */}
      <div className="p-2 border-t border-border/40">
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md mb-1">
          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user?.name ?? user?.email ?? "User"}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Sun className="size-3.5 hidden dark:block" aria-hidden />
            <Moon className="size-3.5 block dark:hidden" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setReportBugOpen(true)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Report a bug"
            title="Report a bug"
          >
            <Bug className="size-3.5" />
          </button>
          <NotificationBell />
        </div>
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          size="sm"
          variant="ghost"
          className="w-full text-muted-foreground hover:text-destructive justify-start gap-2"
        >
          {isLoggingOut ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          {isLoggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-background border-b border-border/60 z-50 flex items-center justify-between px-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground cursor-pointer"
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <span className="font-semibold text-sm">Tasky</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setReportBugOpen(true)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground cursor-pointer"
            aria-label="Report a bug"
          >
            <Bug className="size-4" />
          </button>
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground cursor-pointer"
          >
            <Sun className="size-4 hidden dark:block" aria-hidden />
            <Moon className="size-4 block dark:hidden" aria-hidden />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-56 flex-col bg-[var(--sidebar-bg)] border-r border-border/60 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-56 flex flex-col bg-[var(--sidebar-bg)] border-r border-border/60 z-50",
          "transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 cursor-pointer"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-56 min-h-screen flex flex-col pt-12 lg:pt-0">
        <div className="flex-1 p-5 lg:p-6">
          {!isFetched ? (
            <ScreenLoader variant="app" />
          ) : !hasWorkspaces ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-md">
                <CreateFirstWorkspace
                  onSuccess={(workspace) => setCurrentWorkspaceId(workspace.id)}
                />
              </div>
            </div>
          ) : redirectingToWorkspace ? (
            <ScreenLoader variant="app" />
          ) : (
            children
          )}
        </div>
      </main>

      <PomodoroWidget />
      <ReportBugSheet open={reportBugOpen} onOpenChange={setReportBugOpen} />
      {previewOverlay}
    </div>
  );
}
