import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, CheckSquare, FileText, CalendarDays, BarChart3, Settings } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const AUTH_PATHS = ["/", "/login", "/signup", "/verify"];
export const WORKSPACE_GATE_PATH = "/workspace";
export const FOCUS_PATH_PREFIX = "/focus/";
