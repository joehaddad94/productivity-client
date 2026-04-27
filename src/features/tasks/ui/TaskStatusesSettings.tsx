"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateTaskStatusMutation,
  useDeleteTaskStatusMutation,
  useSwapTaskStatusesMutation,
  useTaskStatusesQuery,
  useUpdateTaskStatusMutation,
} from "@/app/hooks/useTaskStatusesApi";
import type { TaskStatusDefinition } from "@/lib/types";
import type { UpdateTaskStatusBody } from "@/lib/api/task-statuses-api";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { activeTaskStatuses } from "../lib/taskStatusHelpers";

// ─── Color palette ────────────────────────────────────────────────────────────

const STATUS_COLORS = [
  "#9ca3af", "#6b7280", "#ef4444", "#f97316",
  "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
];

function resolvedDotColor(status: TaskStatusDefinition): string {
  if (status.color) return status.color;
  return status.isTerminal ? "#22c55e" : "#9ca3af";
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Pick a colour"
          className="size-5 rounded-full border-2 border-white dark:border-background shadow-sm ring-1 ring-border/40 hover:ring-border transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
          style={{ background: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2.5" align="start" sideOffset={6}>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Colour</p>
        <div className="grid grid-cols-4 gap-1.5">
          {STATUS_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => onChange(c)}
              className={cn(
                "size-6 rounded-full transition-transform hover:scale-110 focus:outline-none cursor-pointer relative",
                value === c && "ring-2 ring-offset-1 ring-ring",
              )}
              style={{ background: c }}
            >
              {value === c && (
                <Check className="size-3 absolute inset-0 m-auto text-white drop-shadow-sm" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── StatusRow ────────────────────────────────────────────────────────────────

function StatusRow({
  status,
  disabled,
  onSave,
  onDelete,
  canDelete,
}: {
  status: TaskStatusDefinition;
  disabled: boolean;
  onSave: (body: UpdateTaskStatusBody) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [isTerminal, setIsTerminal] = useState(status.isTerminal);
  const [color, setColor] = useState(resolvedDotColor(status));

  useEffect(() => {
    setName(status.name);
    setIsTerminal(status.isTerminal);
    setColor(resolvedDotColor(status));
  }, [status.id, status.name, status.isTerminal, status.color]);

  function save() {
    onSave({ name: name.trim(), isTerminal, color });
    setEditing(false);
  }

  function cancel() {
    setName(status.name);
    setIsTerminal(status.isTerminal);
    setColor(resolvedDotColor(status));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-1 items-center gap-2.5 min-w-0 py-0.5">
        <ColorPicker value={color} onChange={setColor} />
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          className="h-7 text-sm flex-1 min-w-0"
          placeholder="Status name"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <Switch
            id={`terminal-${status.id}`}
            checked={isTerminal}
            onCheckedChange={setIsTerminal}
            className="scale-75 origin-left"
          />
          <Label htmlFor={`terminal-${status.id}`} className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            Completes tasks
          </Label>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button type="button" size="sm" className="h-7 px-2.5" disabled={disabled || !name.trim()} onClick={save}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2.5 min-w-0 group/row">
      <div
        className="size-2.5 rounded-full shrink-0 ring-1 ring-black/10"
        style={{ background: resolvedDotColor(status) }}
      />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-1 text-sm font-medium text-left truncate hover:text-primary transition-colors cursor-text min-w-0"
        title="Click to edit"
      >
        {status.name}
      </button>
      {status.isTerminal && (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 shrink-0 font-medium">
          Completes tasks
        </span>
      )}
      <button
        type="button"
        title="Delete status"
        disabled={!canDelete || disabled}
        onClick={onDelete}
        className="opacity-0 group-hover/row:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all disabled:pointer-events-none disabled:opacity-20 shrink-0 cursor-pointer"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// ─── AddStatusRow ─────────────────────────────────────────────────────────────

function AddStatusRow({
  onAdd,
  isPending,
}: {
  onAdd: (body: { name: string; isTerminal: boolean; color: string; sortOrder: number }) => void;
  isPending: boolean;
  nextSortOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isTerminal, setIsTerminal] = useState(false);
  const [color, setColor] = useState("#9ca3af");

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), isTerminal, color, sortOrder: 9999 });
    setName("");
    setIsTerminal(false);
    setColor("#9ca3af");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors cursor-pointer"
      >
        <Plus className="size-3.5 shrink-0" />
        Add a status
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed border-border/60 bg-muted/20">
      <ColorPicker value={color} onChange={setColor} />
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-7 text-sm flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
        placeholder="Status name…"
      />
      <div className="flex items-center gap-1.5 shrink-0">
        <Switch
          id="new-terminal"
          checked={isTerminal}
          onCheckedChange={setIsTerminal}
          className="scale-75 origin-left"
        />
        <Label htmlFor="new-terminal" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
          Completes tasks
        </Label>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          size="sm"
          className="h-7 px-2.5"
          disabled={!name.trim() || isPending}
          onClick={submit}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── TaskStatusesSettings ─────────────────────────────────────────────────────

export function TaskStatusesSettings({ hideTitle = false }: { hideTitle?: boolean }) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const { data: rows = [], isLoading } = useTaskStatusesQuery(workspaceId);
  const sorted = useMemo(() => activeTaskStatuses(rows), [rows]);

  const updateMutation = useUpdateTaskStatusMutation(workspaceId, {
    onError: (e) => toast.error(e.message),
  });
  const swapMutation = useSwapTaskStatusesMutation(workspaceId, {
    onError: (e) => toast.error(e.message),
  });
  const createMutation = useCreateTaskStatusMutation(workspaceId, {
    onSuccess: () => toast.success("Status added"),
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = useDeleteTaskStatusMutation(workspaceId, {
    onSuccess: () => { setDeleteTarget(null); setReplacementId(""); toast.success("Status removed"); },
    onError: (e) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<TaskStatusDefinition | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const isReordering = useRef(false);
  const [reorderingBlocked, setReorderingBlocked] = useState(false);

  const nonTerminalCount = sorted.filter((s) => !s.isTerminal).length;
  const terminalCount = sorted.filter((s) => s.isTerminal).length;

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= sorted.length || isReordering.current) return;
    const a = sorted[index]!;
    const b = sorted[j]!;
    isReordering.current = true;
    setReorderingBlocked(true);
    try {
      await swapMutation.mutateAsync({ idA: a.id, idB: b.id });
    } catch { /* toast from mutation onError */ } finally {
      isReordering.current = false;
      setReorderingBlocked(false);
    }
  }

  if (!workspaceId) {
    return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;
  }

  return (
    <div className="space-y-5">
      {!hideTitle && (
        <div>
          <h2 className="text-sm font-semibold mb-0.5">Task statuses</h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Define the stages tasks move through. At least one non-completing and one completing status are required.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
          {sorted.map((s, index) => (
            <div key={s.id} className="flex items-center gap-1 px-3 py-2 bg-card hover:bg-muted/20 transition-colors">
              {/* Reorder */}
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  disabled={index === 0 || reorderingBlocked}
                  onClick={() => void move(index, -1)}
                  className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer rounded"
                  aria-label="Move up"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  disabled={index === sorted.length - 1 || reorderingBlocked}
                  onClick={() => void move(index, 1)}
                  className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer rounded"
                  aria-label="Move down"
                >
                  <ArrowDown className="size-3" />
                </button>
              </div>

              <StatusRow
                status={s}
                disabled={updateMutation.isPending}
                onSave={(body) => updateMutation.mutate({ id: s.id, body })}
                onDelete={() => {
                  setDeleteTarget(s);
                  setReplacementId(sorted.find((x) => x.id !== s.id)?.id ?? "");
                }}
                canDelete={
                  s.isTerminal ? terminalCount > 1 : nonTerminalCount > 1
                }
              />
            </div>
          ))}

          <div className="px-3 py-1 bg-card">
            <AddStatusRow
              onAdd={({ name, isTerminal, color, sortOrder }) => {
                const maxOrder = sorted.reduce((m, s) => Math.max(m, s.sortOrder), -1);
                createMutation.mutate({ name, isTerminal, color, sortOrder: maxOrder + 1 });
              }}
              isPending={createMutation.isPending}
              nextSortOrder={sorted.reduce((m, s) => Math.max(m, s.sortOrder), -1) + 1}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Choose where to move tasks currently using this status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Move existing tasks to</Label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger className="h-9 cursor-pointer">
                <SelectValue placeholder="Pick a status" />
              </SelectTrigger>
              <SelectContent>
                {sorted.filter((x) => x.id !== deleteTarget?.id).map((x) => (
                  <SelectItem key={x.id} value={x.id} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: resolvedDotColor(x) }}
                      />
                      {x.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!replacementId || deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate({ id: deleteTarget!.id, replacementTaskStatusId: replacementId })
              }
            >
              {deleteMutation.isPending && <Loader2 className="size-3.5 animate-spin mr-1" />}
              Remove status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
