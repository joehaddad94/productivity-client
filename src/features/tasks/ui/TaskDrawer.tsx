"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Trash2, Plus, FileText, Timer, Loader2, ExternalLink, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import { useCreateTaskMutation, useDeleteTaskMutation, useLogTaskFocusMutation } from "@/app/hooks/useTasksApi";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { activeTaskStatuses, firstTerminalStatusId, defaultNonTerminalStatusId, isTaskStatusTerminal } from "../lib/taskStatusHelpers";
import { ProjectPicker } from "./ProjectPicker";

function InlineDescription({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={3}
        className="w-full text-sm text-muted-foreground bg-transparent resize-none outline-none leading-relaxed border-b border-primary/30 pb-0.5 placeholder:text-muted-foreground/40"
        placeholder="Add a description…"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left"
    >
      {value ? (
        <p className="text-sm text-muted-foreground leading-relaxed hover:opacity-70 transition-opacity">
          {value}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/40 italic hover:text-muted-foreground/60 transition-colors">
          Add a description…
        </p>
      )}
    </button>
  );
}

export type TaskDrawerProjectOption = { id: string; name: string };

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, body: UpdateTaskBody) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
  workspaceId: string | null;
  taskStatuses: TaskStatusDefinition[];
  projects?: TaskDrawerProjectOption[];
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
  taskStatuses,
  projects = [],
  isSaving,
  isDeleting,
}: TaskDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "none">("none");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "none">("none");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(0);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize title textarea to fit content
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority ?? "none");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setDueTime(task.dueTime ?? "");
    setRecurrenceRule(task.recurrenceRule ?? "none");
    setProjectId(task.projectId ?? undefined);
    setSubtasks(task.subtasks ?? []);
    setFocusMinutes(task.focusMinutes ?? 0);
    setNewSubtaskTitle("");
    setLogMinutes("");
    setIsDirty(false);
  }, [task?.id, open]);

  const createSubtaskMutation = useCreateTaskMutation(workspaceId, {
    onError: () => {},
  });

  const deleteSubtaskMutation = useDeleteTaskMutation(workspaceId, {
    onError: () => {},
  });

  const logFocusMutation = useLogTaskFocusMutation(workspaceId, {
    onSuccess: (updated) => {
      setFocusMinutes(updated.focusMinutes ?? 0);
      setLogMinutes("");
    },
  });

  function handleLogFocus() {
    if (!task) return;
    const mins = parseInt(logMinutes, 10);
    if (!mins || mins <= 0) return;
    logFocusMutation.mutate({ id: task.id, minutes: mins });
  }

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim() || !task) return;
    const title = newSubtaskTitle.trim();
    setNewSubtaskTitle("");
    createSubtaskMutation.mutate(
      { title, parentTaskId: task.id },
      {
        onSuccess: (created) => {
          setSubtasks((prev) => [...prev, created]);
        },
      },
    );
  }

  function handleDeleteSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    deleteSubtaskMutation.mutate(id, {
      onError: () => {
        setSubtasks((prev) => {
          const original = task?.subtasks?.find((s) => s.id === id);
          return original ? [...prev, original] : prev;
        });
      },
    });
  }

  const { data: notesPage } = useNotesQuery(workspaceId, task ? { taskId: task.id, limit: 10 } : undefined, { enabled: !!task && open });
  const notes = notesPage?.notes ?? [];

  const createNoteMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: () => {},
    onError: () => {},
  });

  if (!task) return null;

  const statusOptions = activeTaskStatuses(taskStatuses);

  function handleSave() {
    if (!task) return;
    onSave(task.id, {
      title: title.trim() || task.title,
      description: description || undefined,
      status,
      priority: priority === "none" ? undefined : priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      recurrenceRule: recurrenceRule === "none" ? undefined : recurrenceRule as "DAILY" | "WEEKLY" | "MONTHLY",
      projectId: projectId ?? null,
    });
    setIsDirty(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-medium text-muted-foreground">Task details</SheetTitle>
            {projectId && (
              <Link
                href={`/projects/${projectId}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {projects.find((p) => p.id === projectId)?.name ?? "Project"}
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            className="w-full text-base font-semibold bg-transparent resize-none outline-none leading-snug mt-1 placeholder:text-muted-foreground/50 overflow-hidden"
            rows={1}
            placeholder="Task title…"
          />
          <InlineDescription
            value={description}
            onChange={(v) => { setDescription(v); setIsDirty(true); }}
          />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Status</Label>
              <Select
                value={status || statusOptions[0]?.id}
                onValueChange={(v) => { setStatus(v); setIsDirty(true); }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
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

          {projects.length > 0 && (
            <>
              <Separator className="opacity-50" />
              <div className="px-5 py-4">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Project</Label>
                <ProjectPicker
                  projects={projects}
                  value={projectId}
                  onChange={(v) => { setProjectId(v); setIsDirty(true); }}
                />
              </div>
            </>
          )}

          <Separator className="opacity-50" />

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

          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Subtasks
              </Label>
              <button
                type="button"
                onClick={() => subtaskInputRef.current?.focus()}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Add subtask"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            {subtasks.length > 0 && (() => {
              const done = subtasks.filter((s) => isTaskStatusTerminal(s.status, taskStatuses)).length;
              const pct = Math.round((done / subtasks.length) * 100);
              return (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{done}/{subtasks.length}</span>
                </div>
              );
            })()}

            <div className="space-y-1.5">
              {subtasks.map((sub) => {
                const done = isTaskStatusTerminal(sub.status, taskStatuses);
                return (
                  <div key={sub.id} className="group flex items-center gap-2.5">
                    <Checkbox
                      checked={done}
                      onCheckedChange={(checked) => {
                        const nextStatus = checked
                          ? firstTerminalStatusId(taskStatuses)
                          : defaultNonTerminalStatusId(taskStatuses);
                        onToggleSubtask(sub.id, checked === true);
                        setSubtasks((prev) =>
                          prev.map((s) =>
                            s.id === sub.id ? { ...s, status: nextStatus } : s,
                          ),
                        );
                      }}
                    />
                    <span className={cn("flex-1 text-sm", done && "line-through text-muted-foreground")}>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      aria-label="Delete subtask"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                ref={subtaskInputRef}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); }
                }}
                placeholder="Add a subtask…"
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40 border-b border-transparent focus:border-border/60 pb-0.5 transition-colors"
              />
              {newSubtaskTitle.trim() && (
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={createSubtaskMutation.isPending}
                  className="text-xs text-primary hover:opacity-70 transition-opacity shrink-0"
                >
                  {createSubtaskMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Add"}
                </button>
              )}
            </div>
          </div>

          <div className="px-5 pb-4">
            <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Focus time</Label>
            <div className="flex items-center gap-2">
              {focusMinutes > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 shrink-0">
                  <Timer className="size-3 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">{focusMinutes} min</span>
                </div>
              )}
              <input
                type="number"
                min={1}
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLogFocus(); } }}
                placeholder="Log minutes…"
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40 border-b border-transparent focus:border-border/60 pb-0.5 transition-colors"
              />
              {logMinutes && parseInt(logMinutes, 10) > 0 && (
                <button
                  type="button"
                  onClick={handleLogFocus}
                  disabled={logFocusMutation.isPending}
                  className="text-xs text-primary hover:opacity-70 transition-opacity shrink-0"
                >
                  {logFocusMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Log"}
                </button>
              )}
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="px-5 py-4 space-y-2">
            {(() => {
              const todayStr = new Date().toISOString().slice(0, 10);
              const isCompleted = isTaskStatusTerminal(status || task.status, taskStatuses);
              const effectiveDueDate = dueDate || task.dueDate?.slice(0, 10);
              const isOverdue = !isCompleted && !!effectiveDueDate && effectiveDueDate < todayStr;
              const overdueDays = isOverdue
                ? Math.floor((new Date(todayStr).getTime() - new Date(effectiveDueDate!).getTime()) / 86400000)
                : 0;
              return (
                <>
                  {isOverdue && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                      <span className="text-xs text-red-500 font-medium">
                        Overdue by {overdueDays} day{overdueDays !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0" />
                      <span>Created {new Date(task.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {task.completedAt && (
                      <div className="flex items-center gap-1.5">
                        <span className="size-3 rounded-full bg-green-500/60 shrink-0" />
                        <span>Completed {new Date(task.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          <Separator className="opacity-50" />

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
                  <Link
                    key={note.id}
                    href="/notes"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 text-xs hover:bg-muted/70 transition-colors group"
                  >
                    <FileText className="size-3 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{note.title}</span>
                    <ArrowUpRight className="size-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

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
