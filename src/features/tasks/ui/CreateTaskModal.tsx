"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Calendar } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import type { CreateTaskBody } from "@/lib/api/tasks-api";
import { ProjectPicker } from "./ProjectPicker";

const PRIORITIES = ["low", "medium", "high"] as const;
const RECURRENCE = ["DAILY", "WEEKLY", "MONTHLY"] as const;

/** Sentinel for Radix Select when no value is chosen (avoids empty string quirks). */
const NONE = "__none__";

export type CreateTaskModalProjectOption = { id: string; name: string };

const controlRing =
  "border border-border bg-input-background shadow-sm transition-[border-color,box-shadow] hover:border-border/90";
const controlFocus =
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:outline-none";

const selectTriggerClass = cn(
  "h-8 w-full justify-between border-border bg-input-background text-xs font-normal shadow-sm cursor-pointer",
  "hover:bg-muted/40 hover:border-border",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
);

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: CreateTaskBody) => void;
  isPending?: boolean;
  defaultParentId?: string;
  projects?: CreateTaskModalProjectOption[];
  /** When set (e.g. list filtered to one project), pre-select in the picker */
  defaultProjectId?: string | null;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  defaultParentId,
  projects = [],
  defaultProjectId,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const valid =
      defaultProjectId && projects.some((p) => p.id === defaultProjectId)
        ? defaultProjectId
        : undefined;
    setProjectId(valid);
  }, [open, defaultProjectId, projects]);

  useEffect(() => {
    if (!dueDate) setDueTime("");
  }, [dueDate]);

  function reset() {
    setTitle("");
    setDescription("");
    setPriority(undefined);
    setDueDate("");
    setDueTime("");
    setRecurrenceRule(undefined);
    setProjectId(undefined);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      recurrenceRule,
      parentTaskId: defaultParentId,
      projectId: projectId || undefined,
    });
    reset();
    onOpenChange(false);
  }

  const fieldLabel = "text-[11px] font-medium text-muted-foreground uppercase tracking-wide";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden border-0 p-0 sm:max-w-md",
          "shadow-2xl shadow-black/20 ring-1 ring-border/60 dark:shadow-black/40 dark:ring-border/80",
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader className="space-y-1 border-b border-border/50 px-5 py-4 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            New task
          </DialogTitle>
          <DialogDescription className="text-xs">
            Add a task. Optional fields can be set below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-task-title" className={fieldLabel}>
              Title
            </Label>
            <input
              id="new-task-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What needs to be done?"
              className={cn(
                "w-full rounded-md px-3 py-2.5 text-sm font-medium",
                controlRing,
                controlFocus,
                "placeholder:text-muted-foreground/60",
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-task-desc" className={fieldLabel}>
              Description
            </Label>
            <textarea
              id="new-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail… (optional)"
              rows={3}
              className={cn(
                "w-full rounded-md px-3 py-2 text-sm resize-none",
                controlRing,
                controlFocus,
                "placeholder:text-muted-foreground/50",
              )}
            />
          </div>

          <div className="space-y-4">
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label className={fieldLabel}>Project</Label>
                <ProjectPicker
                  projects={projects}
                  value={projectId}
                  onChange={setProjectId}
                  disabled={isPending}
                />
              </div>
            )}

            {/* Priority + due date: same row, equal control height, labels aligned */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Label className={fieldLabel}>Priority</Label>
                <Select
                  value={priority ?? NONE}
                  onValueChange={(v) =>
                    setPriority(v === NONE ? undefined : (v as (typeof PRIORITIES)[number]))
                  }
                >
                  <SelectTrigger size="sm" className={selectTriggerClass} aria-label="Priority">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="max-h-60 w-[var(--radix-select-trigger-width)] border-border shadow-lg"
                  >
                    <SelectItem value={NONE} className="text-xs">
                      None
                    </SelectItem>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="new-task-due" className={fieldLabel}>
                  Due date
                </Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="new-task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker?.(); } catch {} }}
                    className={cn(
                      "h-8 min-h-8 w-full py-0 pl-8 text-xs leading-none cursor-pointer",
                      controlRing,
                      controlFocus,
                      "[color-scheme:light] dark:[color-scheme:dark]",
                      "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                    )}
                  />
                </div>
              </div>
            </div>

            {dueDate ? (
              <div className="space-y-2">
                <Label htmlFor="new-task-time" className={fieldLabel}>
                  Due time
                </Label>
                <Input
                  id="new-task-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className={cn(
                    "h-8 max-w-[12rem] py-0 text-xs cursor-pointer",
                    controlRing,
                    controlFocus,
                    "[color-scheme:light] dark:[color-scheme:dark]",
                  )}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label className={fieldLabel}>Repeat</Label>
              <Select
                value={recurrenceRule ?? NONE}
                onValueChange={(v) =>
                  setRecurrenceRule(
                    v === NONE ? undefined : (v as (typeof RECURRENCE)[number]),
                  )
                }
              >
                <SelectTrigger
                  size="sm"
                  className={cn(selectTriggerClass, "max-w-xs")}
                  aria-label="Repeat"
                >
                  <SelectValue placeholder="No repeat" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-[var(--radix-select-trigger-width)] border-border shadow-lg"
                >
                  <SelectItem value={NONE} className="text-xs">
                    No repeat
                  </SelectItem>
                  {RECURRENCE.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/20 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit} disabled={!title.trim() || isPending}>
            Create task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
