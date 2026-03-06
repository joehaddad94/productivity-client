"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Bell, Moon, Sun, LogOut, Loader2, Sparkles, LayoutDashboard } from "lucide-react";
import { useLayout } from "./useLayout";
import { NAV_ITEMS } from "./types";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";

export function Layout({ children }: { children: React.ReactNode }) {
  const [previewMode, setPreviewMode] = useState<"auth" | "skeleton" | null>(null);
  const {
    showSidebar,
    redirectingToWorkspace,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    pathname,
    theme,
    toggleTheme,
    handleLogout,
    user,
    isLoggingOut,
  } = useLayout();

  const initials =
    user?.name?.trim()
      ? user.name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "?"
      : user?.email?.slice(0, 2).toUpperCase() || "?";

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-[var(--header-bg)] border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
        >
          {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <h1 className="font-semibold text-sm">Tasky</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode("auth")}
            className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
            title="Preview auth loading screen"
          >
            <Sparkles className="size-4" />
          </button>
          <button
            onClick={() => setPreviewMode("skeleton")}
            className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
            title="Preview skeleton loading"
          >
            <LayoutDashboard className="size-4" />
          </button>
          <button className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md relative">
            <Bell className="size-4" />
            <Badge className="absolute -top-0.5 -right-0.5 size-3.5 p-0 flex items-center justify-center text-[9px]" variant="destructive">3</Badge>
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
          >
            <Sun className="size-4 hidden dark:block" aria-hidden />
            <Moon className="size-4 block dark:hidden" aria-hidden />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-[var(--sidebar-bg)] border-r border-gray-200 dark:border-gray-800 z-40
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-12 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="font-bold text-base">Tasky</h1>
          </div>

          <div className="px-2.5 py-2 border-b border-gray-200 dark:border-gray-800">
            <WorkspaceSwitcher />
          </div>

          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.path) ?? false;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--nav-active-bg)] text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:bg-[var(--nav-hover)]"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-2.5 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[var(--nav-hover)] cursor-pointer">
              <div className="size-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-xs font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user?.name ?? "User"}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email ?? ""}</div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              size="sm"
              className="mt-1.5 w-full"
              variant="destructive"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      <main className="lg:ml-56 min-h-screen flex flex-col pt-12">
        <div className="hidden lg:flex fixed top-0 right-0 lg:left-56 h-12 flex-shrink-0 items-center justify-end px-4 bg-[var(--header-bg)] border-b border-gray-200 dark:border-gray-800 z-30">
          <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewMode("auth")}
            className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
            title="Preview auth loading screen"
          >
            <Sparkles className="size-4" />
          </button>
          <button
            onClick={() => setPreviewMode("skeleton")}
            className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
            title="Preview skeleton loading"
          >
            <LayoutDashboard className="size-4" />
          </button>
            <button className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md relative">
              <Bell className="size-4" />
              <Badge className="absolute -top-0.5 -right-0.5 size-3.5 p-0 flex items-center justify-center text-[9px]" variant="destructive">3</Badge>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-[var(--nav-hover)] rounded-md"
            >
              <Sun className="size-4 hidden dark:block" aria-hidden />
              <Moon className="size-4 block dark:hidden" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-5">
          <div className="flex-1 min-h-0">
            {redirectingToWorkspace ? (
              <ScreenSkeleton />
            ) : (
              children
            )}
          </div>
        </div>
      </main>

      {/* Full-screen preview: auth loader or skeleton */}
      {previewMode && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--page-bg)]">
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
            className="absolute top-4 right-4 z-[101] shadow-lg"
            onClick={() => setPreviewMode(null)}
          >
            Close preview
          </Button>
        </div>
      )}
    </div>
  );
}
