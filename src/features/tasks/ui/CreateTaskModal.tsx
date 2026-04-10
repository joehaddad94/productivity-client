"use client";

import { useRef, useState } from "react";
import { Calendar, Flag, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import type { CreateTaskBody } from "@/lib/api/tasks-api";

const PRIORITIES = ["low", "medium", "high"] as const;
const RECURRENCE = ["DAILY", "WEEKLY", "MONTHLY"] as const;

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-gray-500 bg-gray-100 dark:bg-gray-800",
  medium: "text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  high: "text-red-600 bg-red-50 dark:bg-red-950/50",
};

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (body: CreateTaskBody) => void;
  isPending?: boolean;
  defaultParentId?: string;
}

export function CreateTaskModal({ open, onOpenChange, onSubmit, isPending, defaultParentId }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | undefined>();
  const titleRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setPriority(undefined);
    setDueDate("");
    setDueTime("");
    setRecurrenceRule(undefined);
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
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" onOpenAutoFocus={(e) => { e.preventDefault(); titleRef.current?.focus(); }}>
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-sm font-medium text-muted-foreground">New task</DialogTitle>
        </DialogHeader>

        {/* Title input */}
        <div className="px-4 pt-2">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            placeholder="Task title…"
            className="w-full text-base font-medium bg-transparent outline-none placeholder:text-muted-foreground/50 py-1"
          />
        </div>

        {/* Options row */}
        <div className="flex items-center gap-1 px-4 py-3 flex-wrap">
          {/* Priority */}
          <div className="relative">
            <select
              value={priority ?? ""}
              onChange={(e) => setPriority(e.target.value as typeof priority || undefined)}
              className={cn(
                "h-7 pl-2.5 pr-7 text-xs rounded-md border border-border/60 outline-none cursor-pointer appearance-none transition-colors",
                priority ? PRIORITY_STYLES[priority] : "text-muted-foreground bg-transparent",
              )}
            >
              <option value="">Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
            <Flag className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none text-muted-foreground" />
          </div>

          {/* Due date */}
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={cn(
                "h-7 pl-2.5 pr-7 text-xs rounded-md border border-border/60 outline-none cursor-pointer appearance-none transition-colors",
                dueDate ? "text-foreground" : "text-muted-foreground",
                "bg-transparent",
              )}
            />
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none text-muted-foreground" />
          </div>

          {/* Due time (only if date set) */}
          {dueDate && (
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="h-7 px-2.5 text-xs rounded-md border border-border/60 bg-transparent outline-none cursor-pointer text-foreground"
            />
          )}

          {/* Recurrence */}
          <div className="relative">
            <select
              value={recurrenceRule ?? ""}
              onChange={(e) => setRecurrenceRule(e.target.value as typeof recurrenceRule || undefined)}
              className={cn(
                "h-7 pl-2.5 pr-7 text-xs rounded-md border border-border/60 outline-none cursor-pointer appearance-none transition-colors",
                recurrenceRule ? "text-primary bg-primary/5" : "text-muted-foreground bg-transparent",
              )}
            >
              <option value="">No repeat</option>
              {RECURRENCE.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <RefreshCw className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={() => { reset(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || isPending}>
            Create task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
