"use client";

import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import type { Workspace } from "@/lib/types";

interface WorkspacePickerProps {
  workspaces: Workspace[];
  onSelect: (workspace: Workspace) => void;
}

export function WorkspacePicker({ workspaces, onSelect }: WorkspacePickerProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 pb-2">
        <div className="size-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-2">
          <Building2 className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Choose a workspace</CardTitle>
        <CardDescription>
          Select the workspace you want to open.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1" role="list">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <button
                type="button"
                onClick={() => onSelect(workspace)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {workspace.slug || workspace.id}
                    {workspace.isPersonal && " · Personal"}
                  </p>
                </div>
                <ChevronRight className="size-5 text-gray-400 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
