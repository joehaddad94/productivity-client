"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, Sparkles, ChevronDown, ChevronRight, UserPlus, X, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/components/ui/utils";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Eye, EyeOff } from "lucide-react";

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
  return (words.length === 1 ? name.slice(0, 2) : words.slice(0, 2).map((w) => w[0]).join(""))
    .toUpperCase() || "?";
}

function roleBadgeClass(role: string) {
  if (role === "owner") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (role === "admin") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

const ASSIGNABLE_ROLES = ["admin", "member"] as const;

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

  const { data: members = [], isLoading: membersLoading } = useMembersQuery(workspace.id, {
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
      toast.success(
        data.canSeeAllTasks
          ? "Member can now see all tasks"
          : "Member can only see assigned tasks",
      ),
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMutation = useRemoveMemberMutation(workspace.id, {
    onSuccess: () => toast.success("Member removed"),
    onError: (err) => toast.error(err.message),
  });

  const color = colorFromId(workspace.id);
  const wsInitials = initials(workspace.name);

  return (
    <li className={cn(
      "rounded-lg border transition-all duration-200",
      "border-gray-200 dark:border-gray-700",
      "hover:border-gray-300 dark:hover:border-gray-600",
      isCurrentWorkspace && "border-l-4 border-l-primary/40 dark:border-l-primary/50 bg-primary/5 dark:bg-primary/10",
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
          {/* Main row */}
          <div className="flex items-center gap-3 p-4">
            {/* Colored initials */}
            <div
              className="size-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-sm font-bold select-none"
              style={{ background: color }}
            >
              {wsInitials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {workspace.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {workspace.slug}
                  {workspace.isPersonal && " · Personal"}
                </span>
                {!membersLoading && currentMember && (
                  <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[10px] font-semibold", roleBadgeClass(currentMember.role))}>
                    {currentMember.role === "owner" && <Crown className="size-2.5" />}
                    {currentMember.role}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCurrentWorkspace ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 dark:bg-primary/25 px-2.5 py-1 text-xs font-medium text-primary">
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
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={onEdit}
                aria-label="Edit workspace"
              >
                <Pencil className="size-4" />
              </Button>

              {/* Delete: hidden once we know user is not owner */}
              {(membersLoading || isOwner) && (
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onRequestDelete}
                  disabled={deleteMutation.isPending && workspaceToDelete?.id === workspace.id}
                  aria-label="Delete workspace"
                >
                  {deleteMutation.isPending && workspaceToDelete?.id === workspace.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}

              {/* Members toggle */}
              <Button
                size="sm" variant="ghost"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setMembersOpen((v) => !v)}
                aria-label="Toggle members"
                title={membersOpen ? "Hide members" : "Show members"}
              >
                {membersOpen
                  ? <ChevronDown className="size-4" />
                  : <ChevronRight className="size-4" />
                }
              </Button>
            </div>
          </div>

          {/* Members panel */}
          {membersOpen && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100 dark:border-gray-800">

              {/* Invite form — owners only */}
              {isOwner && (
                <form onSubmit={(e) => { e.preventDefault(); if (inviteEmail.trim()) inviteMutation.mutate(inviteEmail.trim()); }} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Invite by email…"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteMutation.isPending}
                    className="text-sm h-8"
                  />
                  <Button type="submit" size="sm" disabled={inviteMutation.isPending || !inviteEmail.trim()}>
                    {inviteMutation.isPending
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <UserPlus className="size-3.5" />
                    }
                  </Button>
                </form>
              )}

              {/* Members list */}
              {membersLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
                  <Loader2 className="size-3.5 animate-spin" /> Loading members…
                </div>
              ) : (
                <ul className="space-y-2">
                  {members.map((member) => {
                    const isSelf = member.userId === user?.id;
                    const displayName = member.user.name || member.user.email;
                    const avatarColor = colorFromId(member.userId);
                    const avatarInitials = displayName.slice(0, 2).toUpperCase();
                    return (
                      <li key={member.id} className="flex items-center gap-2.5">
                        <div
                          className="size-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                          style={{ background: avatarColor }}
                        >
                          {avatarInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {displayName}
                            {isSelf && <span className="ml-1 text-gray-400 font-normal">(you)</span>}
                          </p>
                          {member.user.name && (
                            <p className="text-[10px] text-gray-400 truncate">{member.user.email}</p>
                          )}
                        </div>

                        {/* Visibility indicator (member role only) */}
                        {member.role === "member" && (
                          isOwner && !isSelf ? (
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
                                      ? `${displayName} sees all tasks (click to restrict)`
                                      : `${displayName} sees only assigned tasks (click to grant full visibility)`}
                                    className="flex-shrink-0 text-gray-500 hover:text-foreground disabled:opacity-50"
                                  >
                                    {member.canSeeAllTasks
                                      ? <Eye className="size-3.5" />
                                      : <EyeOff className="size-3.5" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[11px]">
                                  {member.canSeeAllTasks ? "Sees all tasks" : "Sees only assigned tasks"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span
                              className="inline-flex items-center text-gray-400"
                              title={member.canSeeAllTasks ? "Sees all tasks" : "Sees only assigned tasks"}
                            >
                              {member.canSeeAllTasks
                                ? <Eye className="size-3.5" />
                                : <EyeOff className="size-3.5" />}
                            </span>
                          )
                        )}

                        {/* Role: editable dropdown for owners (not on self, not the owner row), badge otherwise */}
                        {isOwner && !isSelf && member.role !== "owner" ? (
                          <select
                            value={member.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: member.userId, role: e.target.value })}
                            disabled={updateRoleMutation.isPending}
                            className="text-[11px] rounded border border-gray-200 dark:border-gray-700 bg-background px-1.5 py-0.5 text-gray-600 dark:text-gray-400 cursor-pointer"
                          >
                            {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-semibold", roleBadgeClass(member.role))}>
                            {member.role}
                          </span>
                        )}

                        {/* Remove — owners only, not self */}
                        {isOwner && !isSelf && (
                          <button
                            type="button"
                            onClick={() => removeMemberMutation.mutate(member.userId)}
                            disabled={removeMemberMutation.isPending}
                            className="flex-shrink-0 text-gray-400 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
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
        </>
      )}
    </li>
  );
}
