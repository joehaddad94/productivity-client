import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/notes", label: "Notes", icon: FileText },
];

export const AUTH_PATHS = ["/", "/login", "/signup", "/verify"];
export const WORKSPACE_GATE_PATH = "/workspace";
export const FOCUS_PATH_PREFIX = "/focus/";
