"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { AUTH_PATHS, FOCUS_PATH_PREFIX } from "./types";

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

  const showSidebar = !isAuthOrFocusRoute(pathname ?? "");

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
      toast.success("Logged out successfully!");
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
