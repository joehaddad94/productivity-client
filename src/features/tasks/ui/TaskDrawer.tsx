"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, FileText, Timer, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import type { Task } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, body: UpdateTaskBody) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
  workspaceId: string | null;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function TaskDrawer({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onToggleSubtask,
  workspaceId,
  isSaving,
  isDeleting,
}: TaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Task["status"]>("pending");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "none">("none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "none">("none");
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when the task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setStatus(task.status);
    setPriority(task.priority ?? "none");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setDueTime(task.dueTime ?? "");
    setRecurrenceRule(task.recurrenceRule ?? "none");
    setIsDirty(false);
  }, [task?.id, open]);

  const { data: notesPage } = useNotesQuery(workspaceId, task ? { taskId: task.id, limit: 10 } : undefined, { enabled: !!task && open });
  const notes = notesPage?.notes ?? [];

  const createNoteMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: () => {},
    onError: () => {},
  });

  if (!task) return null;

  function handleSave() {
    if (!task) return;
    onSave(task.id, {
      title: title.trim() || task.title,
      status,
      priority: priority === "none" ? undefined : priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      recurrenceRule: recurrenceRule === "none" ? undefined : recurrenceRule as "DAILY" | "WEEKLY" | "MONTHLY",
    });
    setIsDirty(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <SheetTitle className="text-sm font-medium text-muted-foreground">Task details</SheetTitle>
          {/* Editable title */}
          <textarea
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            className="w-full text-base font-semibold bg-transparent resize-none outline-none leading-snug mt-1 placeholder:text-muted-foreground/50"
            rows={2}
            placeholder="Task title…"
          />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Status + Priority row */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v as Task["status"]); setIsDirty(true); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</Label>
              <Select value={priority} onValueChange={(v) => { setPriority(v as typeof priority); setIsDirty(true); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Due date + time */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Due date</Label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); setIsDirty(true); }}
                className="h-8 w-full px-2.5 text-xs rounded-md border border-border/60 bg-transparent outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Time</Label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => { setDueTime(e.target.value); setIsDirty(true); }}
                disabled={!dueDate}
                className="h-8 w-full px-2.5 text-xs rounded-md border border-border/60 bg-transparent outline-none focus:border-primary/40 transition-colors disabled:opacity-40"
              />
            </div>
          </div>

          {/* Repeat */}
          <div className="px-5 pb-4">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Repeat</Label>
            <Select value={recurrenceRule} onValueChange={(v) => { setRecurrenceRule(v as typeof recurrenceRule); setIsDirty(true); }}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="No repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="opacity-50" />

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="px-5 py-4">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Subtasks ({task.subtasks.filter((s) => s.status === "completed").length}/{task.subtasks.length})
              </Label>
              <div className="space-y-1.5">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2.5">
                    <Checkbox
                      checked={sub.status === "completed"}
                      onCheckedChange={(checked) => onToggleSubtask(sub.id, !!checked)}
                    />
                    <span className={cn("text-sm", sub.status === "completed" && "line-through text-muted-foreground")}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus time */}
          {(task.focusMinutes ?? 0) > 0 && (
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <Timer className="size-3.5 text-primary shrink-0" />
                <span className="text-xs text-primary font-medium">{task.focusMinutes} min focused</span>
              </div>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* Linked notes */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Linked notes {notes.length > 0 && `(${notes.length})`}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                disabled={createNoteMutation.isPending || !workspaceId}
                onClick={() => createNoteMutation.mutate({ title: `Note for: ${task.title}`, tags: [], taskId: task.id })}
              >
                {createNoteMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                New
              </Button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes linked.</p>
            ) : (
              <div className="space-y-1">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 text-xs">
                    <FileText className="size-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/40 flex items-center gap-2">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            Save changes
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            title="Delete task"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
