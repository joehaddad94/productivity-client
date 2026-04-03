import type { LucideIcon } from "lucide-react";
import { FileText, Building2, CheckSquare, FolderOpen, BarChart2 } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/projects", label: "Projects", icon: FolderOpen },
  { path: "/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/workspaces", label: "Workspaces", icon: Building2 },
];

export const AUTH_PATHS = ["/", "/login", "/signup", "/verify"];
export const WORKSPACE_GATE_PATH = "/workspace";
export const FOCUS_PATH_PREFIX = "/focus/";
