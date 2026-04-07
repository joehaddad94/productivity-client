"use client";

import { useState, useEffect } from "react";
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
  const { needsWorkspace, isFetched } = useWorkspace();

  // Auth routes (/, /login, /signup, /verify) and focus: no sidebar.
  // When pathname is unknown (null/empty), treat as auth so we don't show sidebar with wrong loader.
  // App routes (e.g. /notes, /workspace when authenticated): show sidebar so loaders/skeleton appear with navbars.
  const path = pathname ?? "";
  const showSidebar =
    path !== "" &&
    !isAuthOrFocusRoute(path) &&
    (path !== WORKSPACE_GATE_PATH || !!user);

  const redirectingToWorkspace =
    showSidebar &&
    !!user &&
    isFetched &&
    needsWorkspace &&
    path !== WORKSPACE_GATE_PATH;

  const redirectingToLogin =
    isInitialized &&
    !user &&
    path !== "" &&
    !isAuthOrFocusRoute(path) &&
    path !== WORKSPACE_GATE_PATH;

  useEffect(() => {
    if (redirectingToLogin) {
      router.replace("/login");
    } else if (redirectingToWorkspace) {
      router.replace(WORKSPACE_GATE_PATH);
    }
  }, [redirectingToLogin, redirectingToWorkspace, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return {
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
  };
}
