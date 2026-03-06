"use client";

import { useState, useMemo, useRef } from "react";
import {
  Building2,
  Loader2,
  Pencil,
  Trash2,
  X,
  Plus,
  Sparkles,
  Search,
} from "lucide-react";
import {
  slugFromName,
  validateSlug,
  SLUG_MAX,
  NAME_MAX,
} from "@/app/screens/workspace/slug";
import type { Workspace } from "@/lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/app/hooks/useWorkspacesApi";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";

export default function WorkspacesPage() {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    refetchWorkspaces,
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredWorkspaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.slug && w.slug.toLowerCase().includes(q))
    );
  }, [workspaces, searchQuery]);

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
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Manage workspaces
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create, switch, edit, or delete workspaces. Each workspace keeps its own notes and settings.
              </p>
              {currentWorkspace && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Current: <span className="font-medium text-gray-700 dark:text-gray-300">{currentWorkspace.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search workspaces by name or slug…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-lg border-gray-200 dark:border-gray-700 h-11"
          aria-label="Search workspaces"
        />
      </div>

      {/* Create + List in a card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card overflow-hidden">
        <div className="p-5 space-y-5">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Add workspace
            </h2>
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700",
                  "py-4 text-sm font-medium text-gray-600 dark:text-gray-400",
                  "hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 transition-colors"
                )}
              >
                <Plus className="size-4" />
                Create workspace
              </button>
            ) : (
              <CreateForm
                onCancel={() => setShowCreate(false)}
                onSubmit={async (data) => {
                  try {
                    await createMutation.mutateAsync(data);
                    toast.success("Workspace created");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to create workspace");
                  }
                }}
                isPending={createMutation.isPending}
              />
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Your workspaces
              {workspaces.length > 0 && (
                <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">
                  ({filteredWorkspaces.length}
                  {searchQuery.trim() ? " matching" : " total"})
                </span>
              )}
            </h2>
            <ul className="space-y-2">
          {filteredWorkspaces.map((ws) => (
            <li
              key={ws.id}
              className={cn(
                "rounded-lg border transition-all duration-200",
                "border-gray-200 dark:border-gray-700",
                "hover:border-gray-300 dark:hover:border-gray-600",
                currentWorkspace?.id === ws.id &&
                  "border-l-4 border-l-primary/40 dark:border-l-primary/50 bg-primary/5 dark:bg-primary/10"
              )}
            >
              {editing?.id === ws.id ? (
                <div className="p-4">
                  <EditForm
                    workspace={ws}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (data) => {
                      try {
                        await updateMutation.mutateAsync({
                          id: ws.id,
                          body: data,
                        });
                        toast.success("Workspace updated");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed to update workspace");
                      }
                    }}
                    isPending={updateMutation.isPending}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {ws.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {ws.slug || "—"}
                      {ws.isPersonal && " · Personal"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {currentWorkspace?.id === ws.id ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 dark:bg-primary/25 px-2.5 py-1 text-xs font-medium text-primary">
                        <Sparkles className="size-3" />
                        Current
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="min-w-[5rem]"
                        onClick={() => setCurrentWorkspaceId(ws.id)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => setEditing(ws)}
                      aria-label="Edit workspace"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                      disabled={
                        deleteMutation.isPending && deletingId === ws.id
                      }
                      aria-label="Delete workspace"
                    >
                      {deleteMutation.isPending && deletingId === ws.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {workspaces.length === 0 && !showCreate && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
            No workspaces yet. Create one above.
          </p>
        )}
        {workspaces.length > 0 && filteredWorkspaces.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
            No workspaces match &quot;{searchQuery.trim()}&quot;.
          </p>
        )}
          </section>
        </div>
      </div>

      {/* About / tips */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          About workspaces
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Workspaces help you separate work, personal, or project-specific notes. 
          Switch using the workspace dropdown in the sidebar—your current workspace is used for all new notes and tasks.
        </p>
      </div>
    </div>
  );
}

function CreateForm({
  onCancel,
  onSubmit,
  isPending,
}: {
  onCancel: () => void;
  onSubmit: (data: {
    name: string;
    slug?: string;
    isPersonal: boolean;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPersonal, setIsPersonal] = useState(true);
  const slugManuallyEdited = useRef(false);

  const handleNameChange = (value: string) => {
    setName(value.slice(0, NAME_MAX));
    if (!slugManuallyEdited.current) {
      setSlug(slugFromName(value).slice(0, SLUG_MAX));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const finalSlug =
      slug.trim() || slugFromName(trimmed).slice(0, SLUG_MAX);
    if (finalSlug && !validateSlug(finalSlug)) {
      toast.error(
        "Slug: lowercase letters, numbers, hyphens only (max 64)"
      );
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
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4",
        "bg-gray-50/50 dark:bg-gray-800/30"
      )}
    >
      <div className="grid gap-2">
        <Label
          htmlFor="create-name"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </Label>
        <Input
          id="create-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="My Workspace"
          maxLength={NAME_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="create-slug"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug <span className="font-normal text-gray-400">(optional)</span>
        </Label>
        <Input
          id="create-slug"
          value={slug}
          onChange={(e) => {
            slugManuallyEdited.current = true;
            setSlug(
              e.target.value
                .slice(0, SLUG_MAX)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
            );
          }}
          placeholder="my-workspace"
          maxLength={SLUG_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="create-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label
          htmlFor="create-personal"
          className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          Personal workspace
        </Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
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
  onSubmit: (data: {
    name?: string;
    slug?: string;
    isPersonal?: boolean;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug ?? "");
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
      toast.error(
        "Slug: lowercase letters, numbers, hyphens only (max 64)"
      );
      return;
    }
    await onSubmit({
      name: trimmed,
      slug: finalSlug || undefined,
      isPersonal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label
          htmlFor="edit-name"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="grid gap-2">
        <Label
          htmlFor="edit-slug"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Slug
        </Label>
        <Input
          id="edit-slug"
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value
                .slice(0, SLUG_MAX)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
            )
          }
          maxLength={SLUG_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="edit-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label
          htmlFor="edit-personal"
          className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          Personal
        </Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
