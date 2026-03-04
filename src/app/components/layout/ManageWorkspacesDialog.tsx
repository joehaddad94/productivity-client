"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/app/hooks/useWorkspacesApi";
import { slugFromName, validateSlug, SLUG_MAX, NAME_MAX } from "@/app/screens/workspace/slug";
import type { Workspace } from "@/lib/types";
import { toast } from "sonner";

interface ManageWorkspacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageWorkspacesDialog({
  open,
  onOpenChange,
}: ManageWorkspacesDialogProps) {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    refetchWorkspaces,
  } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMutation = useCreateWorkspaceMutation({
    onSuccess: () => {
      setShowCreate(false);
      refetchWorkspaces();
    },
  });
  const updateMutation = useUpdateWorkspaceMutation({
    onSuccess: () => {
      setEditing(null);
      refetchWorkspaces();
    },
  });
  const deleteMutation = useDeleteWorkspaceMutation({
    onSuccess: (_, id) => {
      setDeletingId(null);
      if (currentWorkspace?.id === id) {
        const rest = workspaces.filter((w) => w.id !== id);
        setCurrentWorkspaceId(rest[0]?.id ?? null);
      }
      refetchWorkspaces();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Workspaces</DialogTitle>
          <DialogDescription>
            Create, switch, or manage your workspaces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreate ? (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="size-4 mr-2" />
              Create workspace
            </Button>
          ) : (
            <CreateForm
              onCancel={() => setShowCreate(false)}
              onSubmit={async (data) => {
                await createMutation.mutateAsync(data);
                toast.success("Workspace created");
              }}
              isPending={createMutation.isPending}
            />
          )}

          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {workspaces.map((ws) => (
              <li
                key={ws.id}
                className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                {editing?.id === ws.id ? (
                  <EditForm
                    workspace={ws}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (data) => {
                      await updateMutation.mutateAsync({
                        id: ws.id,
                        body: data,
                      });
                      toast.success("Workspace updated");
                    }}
                    isPending={updateMutation.isPending}
                  />
                ) : (
                  <>
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ws.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ws.slug || ws.id}
                        {ws.isPersonal && " · Personal"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {currentWorkspace?.id !== ws.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCurrentWorkspaceId(ws.id);
                            onOpenChange(false);
                          }}
                        >
                          Switch
                        </Button>
                      )}
                      {currentWorkspace?.id === ws.id && (
                        <span className="text-xs text-primary font-medium px-2">
                          Current
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(ws)}
                        aria-label="Edit workspace"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${ws.name}"? This cannot be undone.`
                            )
                          ) {
                            setDeletingId(ws.id);
                            deleteMutation.mutate(ws.id);
                          }
                        }}
                        disabled={deleteMutation.isPending && deletingId === ws.id}
                        aria-label="Delete workspace"
                      >
                        {deleteMutation.isPending && deletingId === ws.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({
  onCancel,
  onSubmit,
  isPending,
}: {
  onCancel: () => void;
  onSubmit: (data: { name: string; slug?: string; isPersonal: boolean }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const finalSlug = slug.trim() || slugFromName(trimmed).slice(0, SLUG_MAX);
    if (finalSlug && !validateSlug(finalSlug)) {
      toast.error("Slug: lowercase letters, numbers, hyphens only (max 64)");
      return;
    }
    await onSubmit({
      name: trimmed,
      slug: finalSlug || undefined,
      isPersonal,
    });
    setName("");
    setSlug("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
      <div className="grid gap-2">
        <Label htmlFor="create-name">Name</Label>
        <Input
          id="create-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, NAME_MAX));
            setSlug((prev) =>
              prev ? prev : slugFromName(e.target.value).slice(0, SLUG_MAX)
            );
          }}
          placeholder="Workspace name"
          maxLength={NAME_MAX}
          disabled={isPending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="create-slug">Slug (optional)</Label>
        <Input
          id="create-slug"
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value.slice(0, SLUG_MAX).toLowerCase().replace(/[^a-z0-9-]/g, "-")
            )
          }
          placeholder="my-workspace"
          maxLength={SLUG_MAX}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="create-personal"
          checked={isPersonal}
          onChange={(e) => setIsPersonal(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="create-personal" className="cursor-pointer text-sm">
          Personal
        </Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditForm({
  workspace,
  onCancel,
  onSubmit,
  isPending,
}: {
  workspace: Workspace;
  onCancel: () => void;
  onSubmit: (data: { name?: string; slug?: string; isPersonal?: boolean }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [isPersonal, setIsPersonal] = useState(workspace.isPersonal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const finalSlug = slug.trim();
    if (finalSlug && !validateSlug(finalSlug)) {
      toast.error("Slug: lowercase letters, numbers, hyphens only (max 64)");
      return;
    }
    await onSubmit({
      name: trimmed,
      slug: finalSlug || undefined,
      isPersonal,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 flex-1"
    >
      <div className="grid gap-1 flex-1 min-w-[120px]">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          disabled={isPending}
        />
      </div>
      <div className="grid gap-1 flex-1 min-w-[100px]">
        <Label htmlFor="edit-slug">Slug</Label>
        <Input
          id="edit-slug"
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value.slice(0, SLUG_MAX).toLowerCase().replace(/[^a-z0-9-]/g, "-")
            )
          }
          maxLength={SLUG_MAX}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-personal"
          checked={isPersonal}
          onChange={(e) => setIsPersonal(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="edit-personal" className="text-sm cursor-pointer">
          Personal
        </Label>
      </div>
      <div className="flex gap-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
