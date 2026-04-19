"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import {
  useDeleteTagMutation,
  useRenameTagMutation,
  useWorkspaceTagsQuery,
} from "@/app/hooks/useTagsApi";
import { TagChip } from "./TagChip";
import { cn } from "../ui/utils";

export interface ManageTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
}

export function ManageTagsDialog({ open, onOpenChange, workspaceId }: ManageTagsDialogProps) {
  const { data: tags = [], isLoading } = useWorkspaceTagsQuery(workspaceId, {
    enabled: !!workspaceId && open,
  });
  const renameMutation = useRenameTagMutation(workspaceId);
  const deleteMutation = useDeleteTagMutation(workspaceId);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setDraft("");
      setPendingDelete(null);
      setFilter("");
    }
  }, [open]);

  const visibleTags = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return tags;
    return tags.filter((t) => t.tag.includes(f));
  }, [tags, filter]);

  const beginEdit = (tag: string) => {
    setEditing(tag);
    setDraft(tag);
  };

  const commitRename = () => {
    if (!editing) return;
    const next = draft.trim().toLowerCase();
    if (!next || next === editing) {
      setEditing(null);
      setDraft("");
      return;
    }
    const from = editing;
    setEditing(null);
    setDraft("");
    renameMutation.mutate(
      { from, to: next },
      {
        onSuccess: () =>
          toast.success(`Renamed "${from}" to "${next}"`, {
            position: "bottom-right",
            duration: 2000,
          }),
        onError: (err) =>
          toast.error(err.message, { position: "bottom-right", duration: 2500 }),
      },
    );
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
      setDraft("");
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const tag = pendingDelete;
    setPendingDelete(null);
    deleteMutation.mutate(
      { tag },
      {
        onSuccess: (res) =>
          toast.success(
            `Removed "${tag}" from ${res.affected} note${res.affected === 1 ? "" : "s"}`,
            { position: "bottom-right", duration: 2000 },
          ),
        onError: (err) =>
          toast.error(err.message, { position: "bottom-right", duration: 2500 }),
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="manage-tags-dialog" className="max-w-md gap-5">
          <DialogHeader className="space-y-1">
            <DialogTitle>Manage tags</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed sm:text-sm">
              Rename or delete tags across every note in this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="sr-only" htmlFor="manage-tags-search-input">
              Search tags
            </label>
            <Input
              id="manage-tags-search-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search tags…"
              data-testid="manage-tags-search"
              className="h-9 text-sm"
            />
          </div>

          <div className="max-h-[min(50vh,22rem)] overflow-y-auto rounded-lg border border-border/40 p-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : visibleTags.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-8 text-center leading-relaxed">
                {tags.length === 0 ? "No tags yet. Add one from a note." : "No matches."}
              </p>
            ) : (
              <ul className="flex flex-col gap-1" role="list">
                {visibleTags.map(({ tag, count }) => {
                  const isEditing = editing === tag;
                  return (
                    <li
                      key={tag}
                      data-testid="manage-tags-row"
                      data-tag={tag}
                      className={cn(
                        "group flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                        "hover:bg-background/80",
                        isEditing && "bg-background ring-1 ring-border/60 shadow-sm",
                        renameMutation.isPending && "opacity-60",
                      )}
                    >
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={handleEditKeyDown}
                          data-testid="manage-tags-rename-input"
                          className="h-8 flex-1 text-sm"
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <TagChip
                            tag={tag}
                            count={count}
                            size="sm"
                            muted
                            className="bg-primary/10 text-primary/80 border-primary/20 dark:bg-primary/15 dark:text-primary/90"
                          />
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={commitRename}
                            aria-label="Save rename"
                            data-testid="manage-tags-save"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing(null);
                              setDraft("");
                            }}
                            aria-label="Cancel rename"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => beginEdit(tag)}
                            aria-label={`Rename ${tag}`}
                            data-testid="manage-tags-rename"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setPendingDelete(tag)}
                            aria-label={`Delete ${tag}`}
                            data-testid="manage-tags-delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Delete "${pendingDelete ?? ""}"?`}
        description="This will remove the tag from every note in the workspace. Notes themselves are kept."
        confirmLabel="Delete tag"
        onConfirm={confirmDelete}
      />
    </>
  );
}
