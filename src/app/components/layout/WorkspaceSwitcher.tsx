"use client";

import { memo, useId, Fragment } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { cn } from "@/app/components/ui/utils";

function WorkspaceSwitcherComponent() {
  const gradientId = useId();
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspaceId,
    isLoading,
    isFetched,
    hasWorkspaces,
  } = useWorkspace();

  const containerClass = cn(
    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md",
    "text-left transition-colors hover:bg-[var(--nav-hover)]",
    "border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
  );

  const LOADER_COLORS = [
    "var(--loader-1)",
    "var(--loader-2)",
    "var(--loader-3)",
    "var(--loader-4)",
    "var(--loader-5)",
    "var(--loader-6)",
  ];

  if (isLoading || !isFetched) {
    return (
      <>
        <div
          className="w-full flex items-center justify-center py-2 min-h-0"
          aria-busy="true"
        >
          <div className="relative flex items-center justify-center size-9">
            {/* Outer ring: colored segments rotating (matches auth loader) */}
            <svg
              className="size-9 animate-[loader-orbit_3s_linear_infinite]"
              viewBox="0 0 100 100"
              aria-hidden
            >
              {LOADER_COLORS.map((fill, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={fill}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${100 / 6} ${300}`}
                  strokeDashoffset={i * (400 / 6)}
                />
              ))}
            </svg>
            {/* Inner ring: gradient, drawing animation */}
            <svg
              className="absolute size-7 animate-[loader-orbit-reverse_2.5s_linear_infinite]"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--loader-1)" />
                  <stop offset="25%" stopColor="var(--loader-2)" />
                  <stop offset="50%" stopColor="var(--loader-4)" />
                  <stop offset="75%" stopColor="var(--loader-5)" />
                  <stop offset="100%" stopColor="var(--loader-6)" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={251}
                strokeDashoffset={251}
                style={{ animation: "loader-draw 1.6s ease-in-out infinite" }}
              />
            </svg>
            {/* Orbiting dots */}
            <div
              className="absolute inset-0 animate-[loader-orbit_4s_linear_infinite]"
              aria-hidden
            >
              {LOADER_COLORS.map((color, i) => {
                const angle = (i / 6) * 360;
                const rad = (angle * Math.PI) / 180;
                const r = 38;
                const x = 50 + r * Math.cos(rad);
                const y = 50 + r * Math.sin(rad);
                return (
                  <div
                    key={i}
                    className="absolute size-1 rounded-full shadow-sm"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                      background: color,
                      animation: "loader-dot 1.4s ease-in-out infinite",
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                );
              })}
            </div>
            {/* Center: small building icon (workspace context) */}
            <div
              className="absolute flex size-5 items-center justify-center rounded bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-600/80"
              style={{ animation: "loader-pulse-ring 2.2s ease-in-out infinite" }}
            >
              <Building2 className="size-2.5 text-[var(--loader-1)] dark:text-[var(--loader-2)]" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!hasWorkspaces || !currentWorkspace) {
    return (
      <>
        <Link
          href="/workspaces"
          className={containerClass}
          aria-label="No workspace selected"
        >
          <div className="size-8 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="size-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {hasWorkspaces ? "Select workspace" : "No workspace"}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {hasWorkspaces
                ? "Choose or create one"
                : "Create your first workspace"}
            </p>
          </div>
          <ChevronDown className="size-3.5 text-gray-400 flex-shrink-0" />
        </Link>
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={containerClass}
            aria-label="Switch workspace"
          >
            <div className="size-8 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="size-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
                {currentWorkspace.name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronDown className="size-3.5 text-gray-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          className="w-52 rounded-lg border border-gray-200 dark:border-gray-800 border-l-4 border-l-primary/25 dark:border-l-primary/40 shadow-sm bg-card text-card-foreground p-1 text-sm"
        >
          <DropdownMenuLabel
            key="switch-label"
            className="text-[10px] font-normal text-gray-500 dark:text-gray-400"
          >
            Switch workspace
          </DropdownMenuLabel>
          <Fragment key="workspace-list">
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setCurrentWorkspaceId(ws.id)}
              >
                <Building2 className="size-3.5 mr-2 opacity-70" />
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === currentWorkspace.id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </Fragment>
          <DropdownMenuSeparator key="separator" />
          <DropdownMenuItem key="manage" asChild>
            <Link href="/workspaces">
              <Settings2 className="size-3.5 mr-2" />
              Manage workspaces
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export const WorkspaceSwitcher = memo(WorkspaceSwitcherComponent);
