"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, GitCommitHorizontal, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import type { ThreadItem } from "@/lib/types";
import {
  useThreadQuery,
  usePostCommentMutation,
  useDeleteCommentMutation,
} from "@/app/hooks/useTasksApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initialsFor(name: string | null, email?: string): string {
  const src = name ?? email ?? "?";
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ACTIVITY_LABELS: Record<string, (meta: Record<string, unknown>) => string> = {
  created: () => "created this task",
  status_changed: (m) => `changed status to "${m.to}"`,
  due_date_changed: (m) =>
    m.to ? `set due date to ${m.to}` : "removed the due date",
  priority_changed: (m) =>
    m.to ? `changed priority to ${m.to}` : "removed priority",
  assigned: (m) => `assigned ${m.assigneeId ? "a member" : "someone"}`,
  unassigned: () => "removed an assignee",
};

function describeActivity(type: string, metadata: Record<string, unknown> | null): string {
  const fn = ACTIVITY_LABELS[type];
  if (fn) return fn(metadata ?? {});
  return type.replace(/_/g, " ");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CommentItem({
  item,
  currentUserId,
  onDelete,
  isDeleting,
}: {
  item: Extract<ThreadItem, { kind: "comment" }>;
  currentUserId: string | undefined;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const isOwn = item.userId === currentUserId;
  return (
    <div className="flex items-start gap-2.5 group">
      <Avatar className="size-6 shrink-0 mt-0.5">
        <AvatarImage src={item.userAvatarUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">
          {initialsFor(item.userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-foreground">
            {item.userName ?? "Unknown"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(item.createdAt)}
          </span>
        </div>
        <div className="relative rounded-lg bg-muted/60 px-3 py-2 text-sm leading-snug">
          {item.content}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center size-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete comment"
            >
              {isDeleting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  item,
}: {
  item: Extract<ThreadItem, { kind: "activity" }>;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-0.5">
      <div className="flex items-center justify-center size-5 shrink-0">
        <GitCommitHorizontal className="size-3.5 opacity-50" />
      </div>
      <span className="font-medium text-foreground/70">{item.userName ?? "Someone"}</span>
      <span>{describeActivity(item.type, item.metadata)}</span>
      <span className="ml-auto shrink-0">{formatTime(item.createdAt)}</span>
    </div>
  );
}

// ── TaskThread ────────────────────────────────────────────────────────────────

interface TaskThreadProps {
  workspaceId: string | null;
  taskId: string;
  currentUserId: string | undefined;
  /** If false, hide the post box (member not authorized to comment). */
  canComment: boolean;
}

export function TaskThread({
  workspaceId,
  taskId,
  currentUserId,
  canComment,
}: TaskThreadProps) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: thread = [], isLoading } = useThreadQuery(workspaceId, taskId, {
    staleTime: 30_000,
  });

  const postMutation = usePostCommentMutation(workspaceId, taskId, {
    onSuccess: () => {
      setDraft("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteCommentMutation(workspaceId, taskId, {
    onError: (err) => toast.error(err.message),
  });

  function handlePost() {
    const content = draft.trim();
    if (!content) return;
    postMutation.mutate(content);
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="size-3.5 animate-spin" />
          Loading thread…
        </div>
      ) : thread.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 py-1">
          No comments or activity yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {thread.map((item) =>
            item.kind === "comment" ? (
              <CommentItem
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
              />
            ) : (
              <ActivityItem key={item.id} item={item} />
            )
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {canComment && (
        <div className="flex items-end gap-2 pt-1 border-t border-border/50">
          <Avatar className="size-6 shrink-0 mb-1">
            <AvatarFallback className="text-[10px]">
              {initialsFor(null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Add a comment… (⌘Enter to post)"
              rows={2}
              className={cn(
                "w-full resize-none rounded-md px-3 py-2 text-sm",
                "border border-border bg-input-background shadow-sm",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-[3px] focus:ring-ring/35 focus:border-ring",
                "transition-[border-color,box-shadow]",
              )}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!draft.trim() || postMutation.isPending}
            onClick={handlePost}
            className="mb-1 shrink-0"
          >
            {postMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MessageSquare className="size-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
