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
  const { logout, user } = useAuth();
  const { needsWorkspace, isFetched } = useWorkspace();

  const showSidebar =
    !isAuthOrFocusRoute(pathname ?? "") &&
    !(pathname === WORKSPACE_GATE_PATH && needsWorkspace);

  useEffect(() => {
    if (showSidebar && isFetched && needsWorkspace) {
      router.replace(WORKSPACE_GATE_PATH);
    }
  }, [showSidebar, isFetched, needsWorkspace, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      // Defer navigation so React commits setUser(null) before we navigate;
      // otherwise the home page can see stale isAuthenticated and redirect to /workspace.
      setTimeout(() => {
        router.push("/");
        toast.success("Logged out successfully!");
      }, 0);
    } catch (error) {
      toast.error("Failed to log out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return {
    showSidebar,
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
