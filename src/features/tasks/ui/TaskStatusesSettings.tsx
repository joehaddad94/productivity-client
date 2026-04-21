"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateTaskStatusMutation,
  useDeleteTaskStatusMutation,
  useTaskStatusesQuery,
  useUpdateTaskStatusMutation,
} from "@/app/hooks/useTaskStatusesApi";
import type { TaskStatusDefinition } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { activeTaskStatuses } from "../lib/taskStatusHelpers";

export function TaskStatusesSettings({ hideTitle = false }: { hideTitle?: boolean }) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const { data: rows = [], isLoading, refetch } = useTaskStatusesQuery(workspaceId);
  const sorted = useMemo(() => activeTaskStatuses(rows), [rows]);

  const updateStatusMutation = useUpdateTaskStatusMutation(workspaceId, {
    onSuccess: () => toast.success("Status updated"),
    onError: (e) => toast.error(e.message),
  });
  const createMutation = useCreateTaskStatusMutation(workspaceId, {
    onSuccess: () => toast.success("Status created"),
    onError: (e) => toast.error(e.message),
  });
  const deleteStatusMutation = useDeleteTaskStatusMutation(workspaceId, {
    onSuccess: () => toast.success("Status removed"),
    onError: (e) => toast.error(e.message),
  });

  const [newName, setNewName] = useState("");
  const [newTerminal, setNewTerminal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TaskStatusDefinition | null>(null);
  const [replacementId, setReplacementId] = useState<string>("");

  const nonTerminalCount = sorted.filter((s) => !s.isTerminal).length;
  const terminalCount = sorted.filter((s) => s.isTerminal).length;

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[j];
    const ao = a.sortOrder;
    const bo = b.sortOrder;
    try {
      await updateStatusMutation.mutateAsync({ id: a.id, body: { sortOrder: bo } });
      await updateStatusMutation.mutateAsync({ id: b.id, body: { sortOrder: ao } });
    } catch {
      /* toast from mutation */
    }
  }

  function handleCreate() {
    if (!newName.trim() || !workspaceId) return;
    const maxOrder = sorted.reduce((m, s) => Math.max(m, s.sortOrder), -1);
    createMutation.mutate(
      { name: newName.trim(), sortOrder: maxOrder + 1, isTerminal: newTerminal },
      {
        onSuccess: () => {
          setNewName("");
          setNewTerminal(false);
        },
      },
    );
  }

  function confirmDelete() {
    if (!deleteTarget || !workspaceId) return;
    deleteStatusMutation.mutate(
      { id: deleteTarget.id, replacementTaskStatusId: replacementId || undefined },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          setReplacementId("");
        },
      },
    );
  }

  if (!workspaceId) {
    return <p className="text-sm text-muted-foreground">Select a workspace first.</p>;
  }

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div>
          <h2 className="text-sm font-semibold mb-0.5">Task statuses</h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Define workflow columns for tasks. &quot;Done-like&quot; statuses mark work complete (line-through, hidden from open lists).
            Your API must expose{" "}
            <code className="text-[11px] rounded bg-muted px-1">/workspaces/…/task-statuses</code> — until then the app uses the default three statuses.
          </p>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 rounded-xl border border-border/60 divide-y divide-border/50">
          {sorted.map((s, index) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={index === 0 || updateStatusMutation.isPending}
                  onClick={() => void move(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={index === sorted.length - 1 || updateStatusMutation.isPending}
                  onClick={() => void move(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
              <InlineStatusRow
                status={s}
                disabled={updateStatusMutation.isPending}
                onSave={(body) => updateStatusMutation.mutate({ id: s.id, body })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive shrink-0"
                disabled={
                  deleteStatusMutation.isPending ||
                  (s.isTerminal && terminalCount <= 1) ||
                  (!s.isTerminal && nonTerminalCount <= 1)
                }
                onClick={() => {
                  setDeleteTarget(s);
                  const fallback = sorted.find((x) => x.id !== s.id);
                  setReplacementId(fallback?.id ?? "");
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/60 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add status</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-status-name" className="text-xs">
              Name
            </Label>
            <Input
              id="new-status-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. In review"
            />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch id="new-terminal" checked={newTerminal} onCheckedChange={setNewTerminal} />
            <Label htmlFor="new-terminal" className="text-xs cursor-pointer">
              Done-like
            </Label>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            disabled={!newName.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
        Refresh from server
      </Button>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete status &quot;{deleteTarget?.name}&quot;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tasks using this status should be moved to another status if your API requires it.
          </p>
          <div className="space-y-2">
            <Label className="text-xs">Move tasks to</Label>
            <Select value={replacementId} onValueChange={setReplacementId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                {sorted
                  .filter((x) => x.id !== deleteTarget?.id)
                  .map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!replacementId || deleteStatusMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteStatusMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InlineStatusRow({
  status,
  disabled,
  onSave,
}: {
  status: TaskStatusDefinition;
  disabled: boolean;
  onSave: (body: { name?: string; isTerminal?: boolean }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [isTerminal, setIsTerminal] = useState(status.isTerminal);

  useEffect(() => {
    setName(status.name);
    setIsTerminal(status.isTerminal);
  }, [status.name, status.isTerminal, status.id]);

  if (editing) {
    return (
      <div className="flex flex-1 flex-wrap items-end gap-2 min-w-0">
        <div className="flex-1 min-w-[8rem] space-y-1">
          <Label className="text-[10px] text-muted-foreground">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Switch checked={isTerminal} onCheckedChange={setIsTerminal} id={`t-${status.id}`} />
          <Label htmlFor={`t-${status.id}`} className="text-xs cursor-pointer whitespace-nowrap">
            Done-like
          </Label>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || !name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), isTerminal });
              setEditing(false);
            }}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setName(status.name);
              setIsTerminal(status.isTerminal);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-wrap items-center gap-3 min-w-0">
      <span className="text-sm font-medium truncate">{status.name}</span>
      {status.isTerminal && (
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border/60 rounded px-1.5 py-0.5 shrink-0">
          Done-like
        </span>
      )}
      <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => setEditing(true)}>
        <Pencil className="size-3.5" />
      </Button>
    </div>
  );
}
