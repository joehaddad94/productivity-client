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
        <DialogContent data-testid="manage-tags-dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage tags</DialogTitle>
            <DialogDescription>
              Rename or delete tags across every note in this workspace.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search tags"
            data-testid="manage-tags-search"
          />

          <div className="max-h-[50vh] overflow-auto -mx-2 px-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
            ) : visibleTags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {tags.length === 0 ? "No tags yet. Add one from a note." : "No matches."}
              </p>
            ) : (
              <ul className="divide-y">
                {visibleTags.map(({ tag, count }) => {
                  const isEditing = editing === tag;
                  return (
                    <li
                      key={tag}
                      data-testid="manage-tags-row"
                      data-tag={tag}
                      className={cn(
                        "flex items-center gap-2 py-2",
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
                          className="h-8 text-sm"
                        />
                      ) : (
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <TagChip tag={tag} count={count} size="sm" />
                        </div>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
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
                            onClick={() => {
                              setEditing(null);
                              setDraft("");
                            }}
                            aria-label="Cancel rename"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
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
                            onClick={() => setPendingDelete(tag)}
                            aria-label={`Delete ${tag}`}
                            data-testid="manage-tags-delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
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
