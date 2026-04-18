import type { LucideIcon } from "lucide-react";
import { FileText, Building2, SquareCheck, FolderOpen, BarChart2, CalendarDays, Settings, LayoutDashboard } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: SquareCheck },
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/projects", label: "Projects", icon: FolderOpen },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/workspaces", label: "Workspaces", icon: Building2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const AUTH_PATHS = ["/", "/login", "/signup", "/verify"];
export const WORKSPACE_GATE_PATH = "/workspace";
export const FOCUS_PATH_PREFIX = "/focus/";

export function isAuthOrFocusRoute(pathname: string) {
  if (AUTH_PATHS.some((p) => pathname === p)) return true;
  if (pathname.startsWith(FOCUS_PATH_PREFIX)) return true;
  return false;
}
