"use client";

import { cn } from "@/app/components/ui/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { Project } from "@/lib/types";
import { InlineText } from "../InlineText";
import { PROJECT_DETAIL_COLOR_DOT } from "./projectDetailStyles";

export function ProjectDetailHeader({
  project,
  onSaveName,
  onSaveDescription,
  onStatusChange,
}: {
  project: Project;
  onSaveName: (name: string) => void;
  onSaveDescription: (description: string) => void;
  onStatusChange: (status: string) => void;
}) {
  const dot = PROJECT_DETAIL_COLOR_DOT[project.color ?? ""] ?? "bg-primary/30";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className={cn("size-3 rounded-full shrink-0", dot)} />
        <InlineText
          value={project.name}
          onSave={onSaveName}
          placeholder="Project name"
          className="text-2xl font-semibold tracking-tight flex-1"
        />
        <Select value={project.status ?? "active"} onValueChange={onStatusChange}>
          <SelectTrigger
            size="sm"
            className="w-auto text-xs shrink-0"
            aria-label="Project status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
                Active
              </span>
            </SelectItem>
            <SelectItem value="on_hold">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                On hold
              </span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
                Completed
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <InlineText
        value={project.description ?? ""}
        onSave={onSaveDescription}
        placeholder="Add a description…"
        className="text-sm text-muted-foreground"
        multiline
      />
    </div>
  );
}
