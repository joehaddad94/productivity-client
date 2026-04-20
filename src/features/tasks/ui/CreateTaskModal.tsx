"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import type { CreateTaskBody } from "@/lib/api/tasks-api";

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
  "h-8 w-full justify-between border-border bg-input-background text-xs font-normal shadow-sm",
  "hover:bg-muted/40 hover:border-border",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35",
);

function ProjectPicker({
  projects,
  value,
  onChange,
  disabled,
}: {
  projects: CreateTaskModalProjectOption[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const display =
    value && projects.some((p) => p.id === value)
      ? projects.find((p) => p.id === value)!.name
      : "No project";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Project"
          disabled={disabled}
          className={cn(
            selectTriggerClass,
            "px-3 font-normal",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <span className="truncate text-left">{display}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] max-w-sm border border-border bg-popover p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder="Search projects…" className="h-9" />
          <CommandList className="max-h-60">
            <CommandEmpty className="text-xs">No project found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no project all workspace"
                className="cursor-pointer text-xs"
                onSelect={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                No project
              </CommandItem>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.id}`}
                  className="cursor-pointer text-xs"
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
          <p className="text-xs text-muted-foreground">
            Add a task. Optional fields can be set below.
          </p>
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
                <Input
                  id="new-task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={cn(
                    "h-8 min-h-8 w-full py-0 text-xs leading-none",
                    controlRing,
                    controlFocus,
                    "[color-scheme:light] dark:[color-scheme:dark]",
                  )}
                />
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
                    "h-8 max-w-[12rem] py-0 text-xs",
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
