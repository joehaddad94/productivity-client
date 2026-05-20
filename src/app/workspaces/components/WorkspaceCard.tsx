"use client";

import { useState } from "react";
import {
  Loader2, Pencil, Trash2, Sparkles,
  UserPlus, X, Crown, Users, Eye, EyeOff, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";
import { ConfirmDialog } from "@/app/components/ui/confirm-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import type { Workspace } from "@/lib/types";
import { WorkspacesEditForm } from "./WorkspacesEditForm";
import {
  useMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useUpdateMemberVisibilityMutation,
  useRemoveMemberMutation,
} from "@/app/hooks/useMembersApi";
import { useAuth } from "@/app/context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PALETTE = [
  "#059669", "#0d9488", "#0891b2", "#7c3aed",
  "#db2777", "#d97706", "#dc2626", "#2563eb",
];

function colorFromId(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  return (words.length === 1
    ? name.slice(0, 2)
    : words.slice(0, 2).map((w) => w[0]).join("")
  ).toUpperCase() || "?";
}

function roleBadgeClass(role: string) {
  if (role === "owner") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (role === "admin") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-muted text-muted-foreground";
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WorkspaceCardProps {
  workspace: Workspace;
  isCurrentWorkspace: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateSubmit: (data: { name?: string; slug?: string; isPersonal?: boolean }) => Promise<void>;
  onRequestDelete: () => void;
  onSwitch: () => void;
  updateMutation: { isPending: boolean };
  deleteMutation: { isPending: boolean };
  workspaceToDelete: Workspace | null;
}

// ─── WorkspaceCard ────────────────────────────────────────────────────────────

export function WorkspaceCard({
  workspace,
  isCurrentWorkspace,
  editing,
  onEdit,
  onCancelEdit,
  onUpdateSubmit,
  onRequestDelete,
  onSwitch,
  updateMutation,
  deleteMutation,
  workspaceToDelete,
}: WorkspaceCardProps) {
  const { user } = useAuth();
  const [membersOpen, setMembersOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{ userId: string; newRole: string; name: string } | null>(null);

  // Lazy — only fetch when panel is opened (cached across re-opens)
  const { data: members = [], isLoading: membersLoading } = useMembersQuery(workspace.id, {
    enabled: membersOpen,
    staleTime: 60_000,
  });

  const currentMember = members.find((m) => m.userId === user?.id);
  const isOwner = currentMember?.role === "owner";

  const inviteMutation = useInviteMemberMutation(workspace.id, {
    onSuccess: (data) => { toast.success(data.message); setInviteEmail(""); },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = useUpdateMemberRoleMutation(workspace.id, {
    onSuccess: () => toast.success("Role updated"),
    onError: (err) => toast.error(err.message),
  });

  const updateVisibilityMutation = useUpdateMemberVisibilityMutation(workspace.id, {
    onSuccess: (data) =>
      toast.success(data.canSeeAllTasks ? "Can now see all tasks" : "Restricted to assigned tasks"),
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMutation = useRemoveMemberMutation(workspace.id, {
    onSuccess: () => { toast.success("Member removed"); setMemberToRemove(null); },
    onError: (err) => toast.error(err.message),
  });

  const color = colorFromId(workspace.id);
  const wsInitials = initials(workspace.name);
  const memberCount = members.length;

  return (
    <li className={cn(
      "rounded-xl border transition-all duration-200 border-border/60 hover:border-border",
      isCurrentWorkspace && "border-l-4 border-l-primary/50 bg-primary/5",
    )}>
      {editing ? (
        <div className="p-4">
          <WorkspacesEditForm
            workspace={workspace}
            onCancel={onCancelEdit}
            onSubmit={onUpdateSubmit}
            isPending={updateMutation.isPending}
          />
        </div>
      ) : (
        <>
          {/* ── Main row ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 p-4">
            <div
              className="size-10 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold select-none"
              style={{ background: color }}
            >
              {wsInitials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{workspace.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground truncate">
                  {workspace.slug}
                  {workspace.isPersonal && " · Personal"}
                </span>
                {currentMember && (
                  <span className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-semibold",
                    roleBadgeClass(currentMember.role),
                  )}>
                    {currentMember.role === "owner" && <Crown className="size-2.5" />}
                    {currentMember.role}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isCurrentWorkspace ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                  <Sparkles className="size-3" />
                  Current
                </span>
              ) : (
                <Button size="sm" className="min-w-[5rem]" onClick={onSwitch}>
                  Switch
                </Button>
              )}

              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={onEdit}
                aria-label="Edit workspace"
              >
                <Pencil className="size-4" />
              </Button>

              {(membersLoading || isOwner) && (
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onRequestDelete}
                  disabled={deleteMutation.isPending && workspaceToDelete?.id === workspace.id}
                  aria-label="Delete workspace"
                >
                  {deleteMutation.isPending && workspaceToDelete?.id === workspace.id
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Trash2 className="size-4" />
                  }
                </Button>
              )}
            </div>
          </div>

          {/* ── Members toggle ───────────────────────────────────── */}
          <div className="border-t border-border/40">
              <button
                type="button"
                onClick={() => setMembersOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5" />
                  Members
                  {memberCount > 0 && (
                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                      {memberCount}
                    </span>
                  )}
                </span>
                <ChevronDown className={cn("size-3.5 transition-transform", membersOpen && "rotate-180")} />
              </button>

              {/* ── Members panel ───────────────────────────────── */}
              {membersOpen && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/40">

                  {/* Invite form — owners only */}
                  {isOwner && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (inviteEmail.trim()) inviteMutation.mutate(inviteEmail.trim());
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        type="email"
                        placeholder="Invite by email…"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={inviteMutation.isPending}
                        className="text-sm h-9 flex-1"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 gap-1.5 shrink-0"
                        disabled={inviteMutation.isPending || !inviteEmail.trim()}
                      >
                        {inviteMutation.isPending
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <UserPlus className="size-3.5" />
                        }
                        Invite
                      </Button>
                    </form>
                  )}

                  {/* Members list */}
                  {membersLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading members…
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {members.map((member) => {
                        const isSelf = member.userId === user?.id;
                        const displayName = member.user.name || member.user.email;
                        const avatarColor = colorFromId(member.userId);
                        const canEdit = isOwner && !isSelf && member.role !== "owner";

                        return (
                          <li
                            key={member.id}
                            className="flex items-center gap-2.5 py-1.5 rounded-lg"
                          >
                            {/* Avatar */}
                            <div
                              className="size-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                              style={{ background: avatarColor }}
                            >
                              {initials(displayName)}
                            </div>

                            {/* Name + email */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {displayName}
                                {isSelf && (
                                  <span className="ml-1 text-muted-foreground font-normal">(you)</span>
                                )}
                              </p>
                              {member.user.name && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {member.user.email}
                                </p>
                              )}
                            </div>

                            {/* Visibility toggle — all non-owner members */}
                            {member.role !== "owner" && (
                              canEdit ? (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => updateVisibilityMutation.mutate({
                                          userId: member.userId,
                                          canSeeAllTasks: !member.canSeeAllTasks,
                                        })}
                                        disabled={updateVisibilityMutation.isPending}
                                        aria-pressed={member.canSeeAllTasks}
                                        aria-label={member.canSeeAllTasks
                                          ? "Sees all tasks — click to restrict"
                                          : "Sees only assigned tasks — click to grant full visibility"}
                                        className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer transition-colors"
                                      >
                                        {member.canSeeAllTasks
                                          ? <Eye className="size-3.5" />
                                          : <EyeOff className="size-3.5" />
                                        }
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-[11px]">
                                      {member.canSeeAllTasks
                                        ? "Sees all tasks"
                                        : "Sees only assigned tasks"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span
                                  className="shrink-0 text-muted-foreground/50"
                                  title={member.canSeeAllTasks ? "Sees all tasks" : "Sees only assigned tasks"}
                                >
                                  {member.canSeeAllTasks
                                    ? <Eye className="size-3.5" />
                                    : <EyeOff className="size-3.5" />
                                  }
                                </span>
                              )
                            )}

                            {/* Role — Radix Select for editable, badge otherwise */}
                            {canEdit ? (
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => {
                                  // Confirm demotion from admin → member
                                  if (member.role === "admin" && newRole === "member") {
                                    setRoleConfirm({ userId: member.userId, newRole, name: displayName });
                                  } else {
                                    updateRoleMutation.mutate({ userId: member.userId, role: newRole });
                                  }
                                }}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="h-7 w-24 text-xs px-2 border-border/60 bg-muted/30 shadow-none focus-visible:ring-1 cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin" className="text-xs cursor-pointer">Admin</SelectItem>
                                  <SelectItem value="member" className="text-xs cursor-pointer">Member</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={cn(
                                "text-[11px] px-1.5 py-0.5 rounded font-semibold shrink-0",
                                roleBadgeClass(member.role),
                              )}>
                                {member.role}
                              </span>
                            )}

                            {/* Remove */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => setMemberToRemove({ userId: member.userId, name: displayName })}
                                disabled={removeMemberMutation.isPending}
                                className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                                aria-label={`Remove ${displayName}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
        </>
      )}

      {/* Remove member confirmation */}
      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={`Remove ${memberToRemove?.name ?? "member"}?`}
        description="They will be unassigned from all tasks in this workspace. This cannot be undone."
        confirmLabel="Remove"
        isPending={removeMemberMutation.isPending}
        preventAutoClose
        onConfirm={() => {
          if (!memberToRemove) return;
          removeMemberMutation.mutate(memberToRemove.userId);
        }}
      />

      {/* Role demotion confirmation */}
      <ConfirmDialog
        open={!!roleConfirm}
        onOpenChange={(open) => !open && setRoleConfirm(null)}
        title={`Demote ${roleConfirm?.name ?? "member"} to Member?`}
        description="They will lose admin permissions. You can promote them again at any time."
        confirmLabel="Demote"
        onConfirm={() => {
          if (!roleConfirm) return;
          updateRoleMutation.mutate({ userId: roleConfirm.userId, role: roleConfirm.newRole });
          setRoleConfirm(null);
        }}
      />
    </li>
  );
}
