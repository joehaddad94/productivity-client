"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { toast } from "sonner";
import { AUTH_PATHS, FOCUS_PATH_PREFIX, WORKSPACE_GATE_PATH } from "./types";

function isAuthOrFocusRoute(pathname: string) {
  if (AUTH_PATHS.some((p) => pathname === p)) return true;
  if (pathname.startsWith(FOCUS_PATH_PREFIX)) return true;
  return false;
}

export function useLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, user, isInitialized } = useAuth();
  const { needsWorkspace, isFetched, hasWorkspaces, setCurrentWorkspaceId } = useWorkspace();

  // Auth routes (/, /login, /signup, /verify) and focus: no sidebar.
  // When pathname is unknown (null/empty), treat as auth so we don't show sidebar with wrong loader.
  // App routes (e.g. /notes, /workspace when authenticated): show sidebar so loaders/skeleton appear with navbars.
  const path = pathname ?? "";
  const showSidebar = useMemo(
    () =>
      path !== "" &&
      !isAuthOrFocusRoute(path) &&
      (path !== WORKSPACE_GATE_PATH || !!user),
    [path, user]
  );

  // Only redirect to /workspace for the brief transient state where workspaces
  // exist but none is selected (auto-resolved by WorkspaceContext's useEffect).
  // When workspaces.length === 0, show an inline empty state in the content area
  // instead — so the user stays within the app shell with the sidebar visible.
  const redirectingToWorkspace = useMemo(
    () =>
      showSidebar &&
      !!user &&
      isFetched &&
      needsWorkspace &&
      hasWorkspaces &&
      path !== WORKSPACE_GATE_PATH,
    [showSidebar, user, isFetched, needsWorkspace, hasWorkspaces, path]
  );

  const redirectingToLogin = useMemo(
    () =>
      isInitialized &&
      !user &&
      path !== "" &&
      !isAuthOrFocusRoute(path) &&
      path !== WORKSPACE_GATE_PATH,
    [isInitialized, user, path]
  );

  useEffect(() => {
    if (redirectingToLogin) {
      router.replace("/login");
    } else if (redirectingToWorkspace) {
      router.replace(WORKSPACE_GATE_PATH);
    }
  }, [redirectingToLogin, redirectingToWorkspace, router]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, router]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return {
    showSidebar,
    redirectingToWorkspace,
    hasWorkspaces,
    isFetched,
    setCurrentWorkspaceId,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    pathname,
    theme,
    toggleTheme,
    handleLogout,
    user,
    isLoggingOut,
  };
}
