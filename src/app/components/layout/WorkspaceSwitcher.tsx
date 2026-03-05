"use client";

import { useState } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Settings2,
  Plus,
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
import { ManageWorkspacesDialog } from "./ManageWorkspacesDialog";
import { cn } from "@/app/components/ui/utils";

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, setCurrentWorkspaceId } = useWorkspace();
  const [manageOpen, setManageOpen] = useState(false);

  if (!currentWorkspace) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md",
              "text-left transition-colors hover:bg-[var(--nav-hover)]",
              "border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            )}
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
          <DropdownMenuLabel className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
            Switch workspace
          </DropdownMenuLabel>
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setManageOpen(true)}>
            <Settings2 className="size-3.5 mr-2" />
            Manage workspaces
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageWorkspacesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
      />
    </>
  );
}
