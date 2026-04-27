"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import {
  useAdminBugReportsQuery,
  useAdminBugReportsStatsQuery,
  useUpdateAdminBugReportMutation,
} from "@/app/hooks/useBugReportsApi";
import type { BugReport, BugReportStatus } from "@/lib/types";
import {
  attachmentDataUrl,
  parseBugReportImageAttachments,
} from "@/lib/bug-report-attachments";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";

const STATUSES: (BugReportStatus | "all")[] = [
  "all",
  "open",
  "triaging",
  "fixed",
  "wontfix",
  "duplicate",
];

const STATUS_LABEL: Record<BugReportStatus | "all", string> = {
  all: "All",
  open: "Open",
  triaging: "Triaging",
  fixed: "Fixed",
  wontfix: "Won't fix",
  duplicate: "Duplicate",
};

export function AdminBugsScreen() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [tab, setTab] = useState<BugReportStatus | "all">("open");
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [editStatus, setEditStatus] = useState<BugReportStatus>("open");

  const listParams = useMemo(
    () => ({ status: tab, limit: 80, skip: 0 }),
    [tab],
  );

  const selectedAttachments = useMemo(
    () => (selected ? parseBugReportImageAttachments(selected.contextJson) : []),
    [selected],
  );

  const { data: listData, isLoading: listLoading, error: listError } = useAdminBugReportsQuery(
    listParams,
    { enabled: !!user?.isAdmin },
  );
  const { data: stats, isLoading: statsLoading } = useAdminBugReportsStatsQuery({
    enabled: !!user?.isAdmin,
  });
  const updateMutation = useUpdateAdminBugReportMutation({
    onSuccess: () => {
      toast.success("Bug report updated");
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.isAdmin) {
      router.replace("/dashboard");
      toast.error("Admin access only");
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (selected) setEditStatus(selected.status);
  }, [selected]);

  if (!isInitialized || !user?.isAdmin) {
    return <ScreenLoader variant="app" />;
  }

  const bugs = listData?.bugs ?? [];
  const total = listData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bug reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Submissions from users — triage and update status here.
        </p>
      </div>

      {statsLoading || !stats ? (
        <div className="h-20 rounded-lg bg-muted/40 animate-pulse" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Open + triaging</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.totalOpen}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Last 7 days</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.last7Days}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4 col-span-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus ?? {}).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="text-[11px] font-normal">
                  {STATUS_LABEL[k as BugReportStatus] ?? k}: {v}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && Array.isArray(stats.topRoutes) && stats.topRoutes.length > 0 && (
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Top routes</p>
          <ul className="text-sm space-y-1">
            {stats.topRoutes.map((r) => (
              <li key={r.route} className="flex justify-between gap-4">
                <span className="truncate font-mono text-xs text-muted-foreground">{r.route}</span>
                <span className="tabular-nums shrink-0">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {listError && <p className="text-sm text-destructive">Failed to load bug reports.</p>}

      <div className="min-w-0">
        <div className="flex h-auto min-h-9 w-full flex-wrap gap-0.5 bg-muted/40 border border-border/50 p-0.5 rounded-lg">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={cn(
                "cursor-pointer text-xs h-8 shrink-0 rounded-md px-2.5 transition-colors",
                tab === s
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="min-w-0 mt-3">
          {listLoading ? (
            <ScreenLoader variant="app" />
          ) : (
            <div className="space-y-0.5 rounded-lg border border-border/50 divide-y divide-border/40">
              {bugs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No reports in this view.</p>
              ) : (
                bugs.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected(b)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 flex flex-col gap-1 hover:bg-muted/50 transition-colors",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-2">{b.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {STATUS_LABEL[b.status] ?? b.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{b.reporterEmail ?? b.userId}</span>
                      {b.route && <span className="font-mono truncate max-w-[200px]">{b.route}</span>}
                      <span className="tabular-nums">{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                  </button>
                ))
              )}
              {total > bugs.length && (
                <p className="text-xs text-muted-foreground py-2 px-3">Showing {bugs.length} of {total}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="pr-8">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs leading-relaxed">{selected.description}</p>
              </div>
              {selectedAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Screenshots</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAttachments.map((a, i) => (
                      <a
                        key={`${a.fileName}-${i}`}
                        href={attachmentDataUrl(a)}
                        download={a.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-md border border-border/60 bg-muted/20 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from bug reports */}
                        <img
                          src={attachmentDataUrl(a)}
                          alt={a.fileName}
                          className="h-32 w-full object-contain bg-muted/30"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selected.expected && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Expected</Label>
                  <p className="whitespace-pre-wrap text-xs">{selected.expected}</p>
                </div>
              )}
              {selected.actual && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Actual</Label>
                  <p className="whitespace-pre-wrap text-xs">{selected.actual}</p>
                </div>
              )}
              <div className="grid gap-2 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">Reporter:</span> {selected.reporterEmail}</div>
                {selected.route && <div><span className="font-medium text-foreground">Route:</span> <code className="text-[11px]">{selected.route}</code></div>}
                <div><span className="font-medium text-foreground">Id:</span> {selected.id}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as BugReportStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(STATUSES.filter((x) => x !== "all") as BugReportStatus[]).map((st) => (
                      <SelectItem key={st} value={st}>{STATUS_LABEL[st]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button
              type="button"
              disabled={!selected || updateMutation.isPending || editStatus === selected?.status}
              onClick={() => {
                if (!selected) return;
                updateMutation.mutate({
                  id: selected.id,
                  body: { status: editStatus },
                });
              }}
            >
              Save status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
