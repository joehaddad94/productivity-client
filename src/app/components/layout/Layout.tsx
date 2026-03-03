"use client";

import Link from "next/link";
import { Menu, X, Bell, Moon, Sun, LogOut } from "lucide-react";
import { useLayout } from "./useLayout";
import { NAV_ITEMS } from "./types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    showSidebar,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    pathname,
    theme,
    toggleTheme,
    handleLogout,
    user,
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--header-bg)] border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-[var(--nav-hover)] rounded-lg"
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <h1 className="font-semibold">Productivity</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[var(--nav-hover)] rounded-lg relative">
            <Bell className="size-5" />
            <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">3</Badge>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[var(--nav-hover)] rounded-lg"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-[var(--sidebar-bg)] border-r border-gray-200 dark:border-gray-800 z-40
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-14 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
            <h1 className="font-bold text-lg">Productivity</h1>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.path) ?? false;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[var(--nav-active-bg)] text-primary"
                      : "text-gray-700 dark:text-gray-300 hover:bg-[var(--nav-hover)]"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--nav-hover)] cursor-pointer">
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name ?? "User"}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email ?? ""}</div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              className="mt-2 w-full"
              variant="destructive"
            >
              <LogOut className="size-4 mr-2" />
              Logout
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

      <main className="lg:ml-60 min-h-screen pt-14 lg:pt-0">
        <div className="hidden lg:flex h-14 items-center justify-end px-6 bg-[var(--header-bg)] border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[var(--nav-hover)] rounded-lg relative">
              <Bell className="size-5" />
              <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">3</Badge>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[var(--nav-hover)] rounded-lg"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
