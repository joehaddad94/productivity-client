"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  Pencil,
  Trash2,
  X,
  Plus,
  Sparkles,
  Users,
  Mail,
  UserMinus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "@/app/hooks/useWorkspacesApi";
import {
  useMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/app/hooks/useMembersApi";
import { slugFromName, validateSlug, SLUG_MAX, NAME_MAX } from "@/app/screens/workspace/slug";
import type { Workspace } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";

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
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-lg p-0 gap-0 overflow-hidden",
          "border border-gray-200 dark:border-gray-800",
          "shadow-lg shadow-primary/5 dark:shadow-none",
          "bg-card text-card-foreground"
        )}
      >
        <div className="relative min-h-0">
          {/* Left accent strip inside the border so the outline stays even */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-primary/30 dark:bg-primary/40 pointer-events-none"
            aria-hidden
          />
          <DialogHeader className="px-4 pt-4 pb-3 pl-5 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight">
                Manage workspaces
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Create new workspaces, switch between them, or update settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 py-2 pl-5 max-h-[min(70vh,480px)] overflow-y-auto">
          <Tabs defaultValue="workspaces">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="workspaces" className="flex-1">
                <Building2 className="size-3.5 mr-1.5" />
                Workspaces
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1" disabled={!currentWorkspace}>
                <Users className="size-3.5 mr-1.5" />
                Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workspaces" className="space-y-4">
              {/* Create new */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Add workspace
                </h3>
                {!showCreate ? (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700",
                      "py-3 text-xs font-medium text-gray-600 dark:text-gray-400",
                      "hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 transition-colors"
                    )}
                  >
                    <Plus className="size-3.5" />
                    Create workspace
                  </button>
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
              </section>

              {/* List */}
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Your workspaces
                </h3>
                <ul className="space-y-1.5">
                  {workspaces.map((ws) => (
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
                        <div className="p-3">
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3">
                          <div className="size-9 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="size-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {ws.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {ws.slug || "—"}
                              {ws.isPersonal && " · Personal"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {currentWorkspace?.id === ws.id ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 dark:bg-primary/25 px-2 py-0.5 text-[10px] font-medium text-primary">
                                <Sparkles className="size-2.5" />
                                Current
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                className="min-w-[4.5rem] px-3 py-1.5 leading-tight items-center justify-center text-xs"
                                onClick={() => {
                                  setCurrentWorkspaceId(ws.id);
                                  onOpenChange(false);
                                }}
                              >
                                <span className="inline-block text-center w-full">Switch</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              onClick={() => setEditing(ws)}
                              aria-label="Edit workspace"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {workspaces.length === 0 && !showCreate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                    No workspaces yet. Create one above.
                  </p>
                )}
              </section>
            </TabsContent>

            <TabsContent value="members">
              {currentWorkspace && (
                <MembersSection workspaceId={currentWorkspace.id} />
              )}
            </TabsContent>
          </Tabs>
        </div>
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
      toast.error("Slug must contain only lowercase letters, numbers, and hyphens (max 64 characters)");
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
        "rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3",
        "bg-gray-50/50 dark:bg-gray-800/30"
      )}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="create-name" className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Name
        </Label>
        <Input
          id="create-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, NAME_MAX));
            setSlug((prev) =>
              prev ? prev : slugFromName(e.target.value).slice(0, SLUG_MAX)
            );
          }}
          placeholder="My Workspace"
          maxLength={NAME_MAX}
          disabled={isPending}
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="create-slug" className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Slug <span className="font-normal text-gray-400">(optional)</span>
        </Label>
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
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="create-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label
          htmlFor="create-personal"
          className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          Personal workspace
        </Label>
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
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
      toast.error("Slug must contain only lowercase letters, numbers, and hyphens (max 64 characters)");
      return;
    }
    await onSubmit({
      name: trimmed,
      slug: finalSlug || undefined,
      isPersonal,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor="edit-name" className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
      <div className="grid gap-1.5">
        <Label htmlFor="edit-slug" className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Slug
        </Label>
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
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="edit-personal"
          checked={isPersonal}
          onCheckedChange={(c) => setIsPersonal(c === true)}
          disabled={isPending}
        />
        <Label htmlFor="edit-personal" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          Personal
        </Label>
      </div>
      <div className="flex gap-1.5 pt-0.5">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MembersSection({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const { data: members = [], isLoading } = useMembersQuery(workspaceId);
  const { currentWorkspace } = useWorkspace();

  const inviteMutation = useInviteMemberMutation(workspaceId, {
    onSuccess: (res) => {
      toast.success(res.message);
      setEmail("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = useUpdateMemberRoleMutation(workspaceId, {
    onSuccess: () => toast.success("Role updated"),
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useRemoveMemberMutation(workspaceId, {
    onSuccess: () => toast.success("Member removed"),
    onError: (err) => toast.error(err.message),
  });

  const currentUserIsOwner = members.some(
    (m) => m.role === "owner" && m.userId === members[0]?.userId
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim());
  };

  return (
    <div className="space-y-4">
      {/* Invite form */}
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Invite by email
        </h3>
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={inviteMutation.isPending}
              className="pl-8 text-xs rounded-md"
            />
          </div>
          <Button type="submit" size="sm" disabled={inviteMutation.isPending || !email.trim()}>
            {inviteMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Invite"
            )}
          </Button>
        </form>
      </section>

      {/* Members list */}
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Members ({members.length})
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <ul className="space-y-1.5">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
                  {(member.user.name ?? member.user.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{member.user.email}</p>
                </div>
                <Select
                  value={member.role}
                  onValueChange={(role) =>
                    updateRoleMutation.mutate({ userId: member.userId, role })
                  }
                  disabled={member.role === "owner" || !currentUserIsOwner}
                >
                  <SelectTrigger className="h-6 text-[10px] w-20 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                {member.role !== "owner" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm(`Remove ${member.user.email}?`)) {
                        removeMutation.mutate(member.userId);
                      }
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <UserMinus className="size-3" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
