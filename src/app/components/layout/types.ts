import type { LucideIcon } from "lucide-react";
import { FileText, Building2 } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/workspaces", label: "Workspaces", icon: Building2 },
];

export const AUTH_PATHS = ["/", "/login", "/signup", "/verify"];
export const WORKSPACE_GATE_PATH = "/workspace";
export const FOCUS_PATH_PREFIX = "/focus/";
