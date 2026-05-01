"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Trash2, Plus, FileText, Timer, Loader2,
  ExternalLink, Clock, AlertTriangle, ArrowUpRight, Check,
} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import { useNotesQuery, useCreateNoteMutation } from "@/app/hooks/useNotesApi";
import { useCreateTaskMutation, useDeleteTaskMutation, useLogTaskFocusMutation, useUpdateTaskMutation } from "@/app/hooks/useTasksApi";
import type { Task, TaskStatusDefinition } from "@/lib/types";
import type { UpdateTaskBody } from "@/lib/api/tasks-api";
import { activeTaskStatuses, firstTerminalStatusId, defaultNonTerminalStatusId, isTaskStatusTerminal } from "../lib/taskStatusHelpers";
import { ProjectPicker } from "./ProjectPicker";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFocus(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── PropRow — consistent label + control layout ───────────────────────────────

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center min-h-[2rem] gap-2">
      <span className="text-[12px] text-muted-foreground shrink-0">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
      {action}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── TaskDrawer ───────────────────────────────────────────────────────────────

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
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const [logMinutes, setLogMinutes] = useState("");
  const [showLogInput, setShowLogInput] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Keep stable refs for callbacks/task so the auto-save timer always reads fresh values
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const taskRef = useRef(task);
  taskRef.current = task;

  // Auto-resize title textarea
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  // Reset form when task or open state changes
  useEffect(() => {
    if (!task || !open) return;
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
    setShowLogInput(false);
    setIsDirty(false);
  }, [task?.id, open]);

  // Auto-save — debounced 700ms after last change
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      const t = taskRef.current;
      if (!t) return;
      onSaveRef.current(t.id, {
        title: title.trim() || t.title,
        description: description || undefined,
        status,
        priority: priority === "none" ? undefined : priority as "low" | "medium" | "high",
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        recurrenceRule: recurrenceRule === "none" ? undefined : recurrenceRule as "DAILY" | "WEEKLY" | "MONTHLY",
        projectId: projectId ?? null,
      });
      setIsDirty(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [isDirty, title, description, status, priority, dueDate, dueTime, recurrenceRule, projectId]);

  // ── Subtask mutations ──────────────────────────────────────────────────────
  const createSubtaskMutation = useCreateTaskMutation(workspaceId, { onError: () => {} });
  const deleteSubtaskMutation = useDeleteTaskMutation(workspaceId, { onError: () => {} });
  const updateSubtaskMutation = useUpdateTaskMutation(workspaceId, { onError: () => {} });

  function handleAddSubtask() {
    if (!newSubtaskTitle.trim() || !task) return;
    const t = newSubtaskTitle.trim();
    setNewSubtaskTitle("");
    createSubtaskMutation.mutate({ title: t, parentTaskId: task.id }, {
      onSuccess: (created) => setSubtasks((prev) => [...prev, created]),
    });
  }

  function handleSaveSubtaskTitle(id: string, newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, title: trimmed } : s));
    updateSubtaskMutation.mutate({ id, body: { title: trimmed } });
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

  // ── Focus log ──────────────────────────────────────────────────────────────
  const logFocusMutation = useLogTaskFocusMutation(workspaceId, {
    onSuccess: (updated) => {
      setFocusMinutes(updated.focusMinutes ?? 0);
      setLogMinutes("");
      setShowLogInput(false);
    },
  });

  function handleLogFocus() {
    if (!task) return;
    const mins = parseInt(logMinutes, 10);
    if (!mins || mins <= 0) return;
    logFocusMutation.mutate({ id: task.id, minutes: mins });
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  const { data: notesPage } = useNotesQuery(
    workspaceId,
    task ? { taskId: task.id, limit: 10 } : undefined,
    { enabled: !!task },
  );
  const notes = notesPage?.notes ?? [];

  const createNoteMutation = useCreateNoteMutation(workspaceId, { onSuccess: () => {}, onError: () => {} });

  if (!task) return null;

  const statusOptions = activeTaskStatuses(taskStatuses);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isCompleted = isTaskStatusTerminal(status || task.status, taskStatuses);
  const effectiveDueDate = dueDate || task.dueDate?.slice(0, 10);
  const isOverdue = !isCompleted && !!effectiveDueDate && effectiveDueDate < todayStr;
  const overdueDays = isOverdue
    ? Math.floor((Date.now() - new Date(effectiveDueDate!).getTime()) / 86_400_000)
    : 0;

  const subtaskDone = subtasks.filter((s) => isTaskStatusTerminal(s.status, taskStatuses)).length;
  const subtaskPct = subtasks.length > 0 ? Math.round((subtaskDone / subtasks.length) * 100) : 0;

  const projectName = projects.find((p) => p.id === (projectId ?? task.projectId))?.name;

  function mark(setter: (v: any) => void) {
    return (v: any) => { setter(v); setIsDirty(true); };
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] flex flex-col p-0 gap-0" aria-describedby={undefined}>

        {/* ── Header: title only ────────────────────────────────────── */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border/40 gap-0">
          <div className="flex items-center justify-between pr-7 mb-2">
            <SheetTitle className="text-xs font-medium text-muted-foreground tracking-wide">
              {projectName ? (
                <Link
                  href={`/projects/${projectId ?? task.projectId}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {projectName}
                  <ExternalLink className="size-3" />
                </Link>
              ) : (
                "Task"
              )}
            </SheetTitle>
            {isSaving && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </span>
            )}
          </div>

          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) e.preventDefault(); }}
            className="w-full text-lg font-semibold bg-transparent resize-none outline-none leading-snug placeholder:text-muted-foreground/40"
            rows={1}
            placeholder="Task title…"
          />
        </SheetHeader>

        {/* ── Scrollable body ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Overdue banner */}
          {isOverdue && (
            <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
              <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
              <span className="text-xs text-red-500 font-medium">
                Overdue by {overdueDays} day{overdueDays !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="px-6 pt-4 pb-2">
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
              rows={description ? undefined : 2}
              placeholder="Add a description…"
              className="w-full text-sm text-muted-foreground bg-transparent resize-none outline-none leading-relaxed placeholder:text-muted-foreground/35 focus:placeholder:text-muted-foreground/50 min-h-[2.5rem]"
            />
          </div>

          {/* ── Properties ─────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border/40 space-y-1">
            <SectionHeader title="Properties" />

            <PropRow label="Status">
              <Select value={status || statusOptions[0]?.id} onValueChange={mark(setStatus)}>
                <SelectTrigger className="h-8 text-sm border-0 bg-muted/40 hover:bg-muted/70 shadow-none px-2.5 cursor-pointer focus-visible:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm cursor-pointer">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Priority">
              <Select value={priority} onValueChange={mark(setPriority)}>
                <SelectTrigger className="h-8 text-sm border-0 bg-muted/40 hover:bg-muted/70 shadow-none px-2.5 cursor-pointer focus-visible:ring-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-sm cursor-pointer">None</SelectItem>
                  <SelectItem value="low" className="text-sm cursor-pointer">Low</SelectItem>
                  <SelectItem value="medium" className="text-sm cursor-pointer">Medium</SelectItem>
                  <SelectItem value="high" className="text-sm cursor-pointer">High</SelectItem>
                </SelectContent>
              </Select>
            </PropRow>

            {projects.length > 0 && (
              <PropRow label="Project">
                <ProjectPicker
                  projects={projects}
                  value={projectId}
                  onChange={mark(setProjectId)}
                  triggerClassName="h-8 text-sm border-0 bg-muted/40 hover:bg-muted/70 shadow-none px-2.5 focus-visible:ring-1"
                />
              </PropRow>
            )}

            <PropRow label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); if (!e.target.value) setDueTime(""); setIsDirty(true); }}
                className="h-8 w-full px-2.5 text-sm rounded-md bg-muted/40 hover:bg-muted/70 border-0 outline-none focus:ring-1 focus:ring-ring/50 transition-colors cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </PropRow>

            {dueDate && (
              <PropRow label="Due time">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => { setDueTime(e.target.value); setIsDirty(true); }}
                  className="h-8 w-full px-2.5 text-sm rounded-md bg-muted/40 hover:bg-muted/70 border-0 outline-none focus:ring-1 focus:ring-ring/50 transition-colors cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
              </PropRow>
            )}

            <PropRow label="Repeat">
              <Select value={recurrenceRule} onValueChange={mark(setRecurrenceRule)}>
                <SelectTrigger className="h-8 text-sm border-0 bg-muted/40 hover:bg-muted/70 shadow-none px-2.5 cursor-pointer focus-visible:ring-1">
                  <SelectValue placeholder="No repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-sm cursor-pointer">No repeat</SelectItem>
                  <SelectItem value="DAILY" className="text-sm cursor-pointer">Daily</SelectItem>
                  <SelectItem value="WEEKLY" className="text-sm cursor-pointer">Weekly</SelectItem>
                  <SelectItem value="MONTHLY" className="text-sm cursor-pointer">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </PropRow>

            <PropRow label="Focus time">
              <div className="flex items-center gap-2 min-w-0">
                {focusMinutes > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-primary shrink-0">
                    <Timer className="size-3.5 shrink-0" />
                    {formatFocus(focusMinutes)}
                  </span>
                )}
                {showLogInput ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      autoFocus
                      type="number"
                      min={1}
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleLogFocus(); }
                        if (e.key === "Escape") { setShowLogInput(false); setLogMinutes(""); }
                      }}
                      placeholder="Minutes…"
                      className="w-20 h-7 px-2 text-sm rounded-md bg-muted/60 border-0 outline-none focus:ring-1 focus:ring-ring/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={handleLogFocus}
                      disabled={!logMinutes || parseInt(logMinutes, 10) <= 0 || logFocusMutation.isPending}
                      className="h-7 px-2.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                    >
                      {logFocusMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Log"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowLogInput(false); setLogMinutes(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLogInput(true)}
                    className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
                  >
                    {focusMinutes > 0 ? "+ Log more" : "Log time"}
                  </button>
                )}
              </div>
            </PropRow>
          </div>

          {/* ── Subtasks ───────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border/40">
            <SectionHeader
              title={subtasks.length > 0 ? `Subtasks · ${subtaskDone}/${subtasks.length}` : "Subtasks"}
              action={
                <button
                  type="button"
                  onClick={() => subtaskInputRef.current?.focus()}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-muted/60"
                  aria-label="Add subtask"
                >
                  <Plus className="size-3.5" />
                </button>
              }
            />

            {subtasks.length > 0 && (
              <div className="mb-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${subtaskPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              {subtasks.map((sub) => {
                const done = isTaskStatusTerminal(sub.status, taskStatuses);
                return (
                  <div key={sub.id} className="group flex items-center gap-2.5 py-0.5">
                    <Checkbox
                      checked={done}
                      onCheckedChange={(checked) => {
                        const nextStatus = checked
                          ? firstTerminalStatusId(taskStatuses)
                          : defaultNonTerminalStatusId(taskStatuses);
                        onToggleSubtask(sub.id, checked === true);
                        setSubtasks((prev) =>
                          prev.map((s) => s.id === sub.id ? { ...s, status: nextStatus } : s),
                        );
                      }}
                    />
                    {editingSubtaskId === sub.id ? (
                      <input
                        autoFocus
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onBlur={() => { handleSaveSubtaskTitle(sub.id, editingSubtaskTitle); setEditingSubtaskId(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleSaveSubtaskTitle(sub.id, editingSubtaskTitle); setEditingSubtaskId(null); }
                          if (e.key === "Escape") setEditingSubtaskId(null);
                        }}
                        className="flex-1 text-sm bg-transparent outline-none border-b border-primary/30 pb-0.5"
                      />
                    ) : (
                      <span
                        className={cn("flex-1 text-sm cursor-text select-none min-w-0 truncate", done && "line-through text-muted-foreground")}
                        onClick={() => { setEditingSubtaskId(sub.id); setEditingSubtaskTitle(sub.title); }}
                      >
                        {sub.title}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all shrink-0 cursor-pointer"
                      aria-label="Delete subtask"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2 pt-1">
              <Plus className="size-3.5 text-muted-foreground/40 shrink-0" />
              <input
                ref={subtaskInputRef}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="Add a subtask…"
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/35 focus:placeholder:text-muted-foreground/50"
              />
              {newSubtaskTitle.trim() && (
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={createSubtaskMutation.isPending}
                  className="text-xs font-medium text-primary hover:opacity-70 transition-opacity shrink-0 cursor-pointer"
                >
                  {createSubtaskMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Add"}
                </button>
              )}
            </div>
          </div>

          {/* ── Notes ─────────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border/40">
            <SectionHeader
              title={notes.length > 0 ? `Notes · ${notes.length}` : "Notes"}
              action={
                <button
                  type="button"
                  disabled={createNoteMutation.isPending || !workspaceId}
                  onClick={() => createNoteMutation.mutate({ title: `Note for: ${task.title}`, tags: [], taskId: task.id })}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="New note"
                >
                  {createNoteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                </button>
              }
            />

            {notes.length === 0 ? (
              <button
                type="button"
                disabled={createNoteMutation.isPending || !workspaceId}
                onClick={() => createNoteMutation.mutate({ title: `Note for: ${task.title}`, tags: [], taskId: task.id })}
                className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer disabled:pointer-events-none"
              >
                <Plus className="size-3.5 shrink-0" />
                Add a note
              </button>
            ) : (
              <div className="space-y-1">
                {notes.map((note) => (
                  <Link
                    key={note.id}
                    href="/notes"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/40 text-sm hover:bg-muted/70 transition-colors group"
                  >
                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 text-sm">{note.title}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Metadata ──────────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-border/40 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Clock className="size-3 shrink-0" />
              Created {new Date(task.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {task.completedAt && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <Check className="size-3 shrink-0 text-emerald-500" />
                Completed {new Date(task.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/50">
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </span>
            ) : isDirty ? (
              "Unsaved changes"
            ) : (
              "All changes saved"
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5 cursor-pointer"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
