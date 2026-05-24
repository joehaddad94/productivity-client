"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ClipboardCopy, Search, ArrowUpDown, X } from "lucide-react";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30;

const STATUSES: (BugReportStatus | "all")[] = [
  "all", "open", "triaging", "fixed", "wontfix", "duplicate",
];

const STATUS_LABEL: Record<BugReportStatus | "all", string> = {
  all: "All",
  open: "Open",
  triaging: "Triaging",
  fixed: "Fixed",
  wontfix: "Won't fix",
  duplicate: "Duplicate",
};

const STATUS_BADGE: Record<BugReportStatus, string> = {
  open:      "border-red-500/30 bg-red-500/10 text-red-500",
  triaging:  "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  fixed:     "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
  wontfix:   "bg-muted text-muted-foreground border-border/50",
  duplicate: "border-blue-500/30 bg-blue-500/10 text-blue-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── AdminBugsScreen ──────────────────────────────────────────────────────────

export function AdminBugsScreen() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  // ── Filters / sort ────────────────────────────────────────────────────────
  const [tab, setTab] = useState<BugReportStatus | "all">("open");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [routeFilter, setRouteFilter] = useState<string | null>(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [allBugs, setAllBugs] = useState<BugReport[]>([]);
  const isLoadMoreRef = useRef(false);

  // ── Detail dialog ─────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [editStatus, setEditStatus] = useState<BugReportStatus>("open");
  const [copied, setCopied] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const listParams = useMemo(
    () => ({ status: tab, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    [tab, page],
  );

  const { data: listData, isLoading: listLoading } = useAdminBugReportsQuery(
    listParams,
    { enabled: !!user?.isAdmin, staleTime: 30_000 },
  );
  const { data: stats, isLoading: statsLoading } = useAdminBugReportsStatsQuery({
    enabled: !!user?.isAdmin,
    staleTime: 30_000,
  });

  const updateMutation = useUpdateAdminBugReportMutation({
    onSuccess: () => {
      toast.success("Bug report updated");
      setSelected(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Accumulate pages ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!listData?.bugs) return;
    if (isLoadMoreRef.current) {
      setAllBugs((prev) => [...prev, ...listData.bugs]);
      isLoadMoreRef.current = false;
    } else {
      setAllBugs(listData.bugs);
    }
  }, [listData]);

  // Reset on tab change
  useEffect(() => {
    isLoadMoreRef.current = false;
    setPage(0);
    setAllBugs([]);
    setRouteFilter(null);
    setSearch("");
  }, [tab]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    if (!user) { router.replace("/login"); return; }
    if (!user.isAdmin) { router.replace("/dashboard"); toast.error("Admin access only"); }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (selected) setEditStatus(selected.status);
  }, [selected]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedAttachments = useMemo(
    () => (selected ? parseBugReportImageAttachments(selected.contextJson) : []),
    [selected],
  );

  const filteredBugs = useMemo(() => {
    let result = allBugs;
    if (routeFilter) result = result.filter((b) => b.route === routeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.reporterEmail?.toLowerCase().includes(q) ||
          b.route?.toLowerCase().includes(q),
      );
    }
    if (sortBy === "oldest") {
      result = [...result].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return result;
  }, [allBugs, search, routeFilter, sortBy]);

  const total = listData?.total ?? 0;
  const hasMore = allBugs.length < total && !search.trim() && !routeFilter;
  const hasUnsaved = selected && editStatus !== selected.status;

  if (!isInitialized || !user?.isAdmin) return <ScreenLoader variant="app" />;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleLoadMore() {
    isLoadMoreRef.current = true;
    setPage((p) => p + 1);
  }

  function handleCopyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      if (hasUnsaved && !window.confirm("Discard unsaved status change?")) return;
      setSelected(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bug reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Submissions from users. Triage and update status here.
        </p>
      </div>

      {/* Stats */}
      {statsLoading || !stats ? (
        <div className="h-20 rounded-lg bg-muted/40 animate-pulse" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/60 p-4 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">Open + triaging</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.totalOpen}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">Last 7 days</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{stats.last7Days}</p>
          </div>
          <div className="rounded-xl border border-border/60 p-4 col-span-2 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">By status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus ?? {}).map(([k, v]) => (
                <Badge
                  key={k}
                  variant="outline"
                  className={cn(
                    "text-[11px] font-normal cursor-pointer",
                    STATUS_BADGE[k as BugReportStatus] ?? "",
                  )}
                  onClick={() => setTab(k as BugReportStatus)}
                >
                  {STATUS_LABEL[k as BugReportStatus] ?? k}: {v}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top routes */}
      {stats && Array.isArray(stats.topRoutes) && stats.topRoutes.length > 0 && (
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Top routes
            {routeFilter && (
              <button
                type="button"
                onClick={() => setRouteFilter(null)}
                className="ml-2 text-primary hover:underline normal-case tracking-normal font-normal cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </p>
          <ul className="text-sm space-y-1">
            {stats.topRoutes.map((r) => (
              <li key={r.route} className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setRouteFilter(r.route === routeFilter ? null : r.route)}
                  className={cn(
                    "font-mono text-xs text-left truncate hover:text-primary transition-colors cursor-pointer",
                    routeFilter === r.route ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  {r.route}
                </button>
                <span className="tabular-nums shrink-0 text-xs">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status tabs + search/sort toolbar */}
      <div className="space-y-2">

        {/* Scrollable status tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-0.5 bg-muted/40 border border-border/50 p-0.5 rounded-lg">
          {STATUSES.map((s) => {
            const count = s === "all"
              ? undefined
              : stats?.byStatus?.[s as BugReportStatus];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setTab(s)}
                className={cn(
                  "cursor-pointer text-xs h-8 shrink-0 rounded-md px-2.5 transition-colors whitespace-nowrap flex items-center gap-1",
                  tab === s
                    ? "bg-background shadow-sm text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {STATUS_LABEL[s]}
                {count !== undefined && (
                  <span className={cn(
                    "text-[10px] tabular-nums px-1 rounded-full",
                    tab === s ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + sort row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, description, email, route…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pl-8 pr-3 text-xs rounded-md bg-muted/40 border border-border/50 outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8 w-auto text-xs bg-muted/40 border-border/50 shadow-none gap-1 focus-visible:ring-1 shrink-0">
              <ArrowUpDown className="size-3 opacity-50 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest" className="text-xs">Newest first</SelectItem>
              <SelectItem value="oldest" className="text-xs">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active route filter chip */}
        {routeFilter && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <span>Filtering by route:</span>
            <code className="font-mono bg-primary/10 px-1.5 py-0.5 rounded">{routeFilter}</code>
            <button type="button" onClick={() => setRouteFilter(null)} className="hover:opacity-70 cursor-pointer">
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Bug list */}
      <div>
        {listLoading && allBugs.length === 0 ? (
          <ScreenLoader variant="app" />
        ) : (
          <>
            <div className="rounded-lg border border-border/50 divide-y divide-border/40">
              {filteredBugs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {search || routeFilter ? "No reports match your filters." : "No reports in this view."}
                </p>
              ) : (
                filteredBugs.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected(b)}
                    className="w-full text-left px-3 py-2.5 flex flex-col gap-1 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-2 min-w-0">{b.title}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] shrink-0",
                          STATUS_BADGE[b.status] ?? "",
                        )}
                      >
                        {STATUS_LABEL[b.status] ?? b.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      {b.reporterEmail && (
                        <span className="truncate max-w-[160px] sm:max-w-none">{b.reporterEmail}</span>
                      )}
                      {b.route && (
                        <span className="font-mono truncate max-w-[120px] sm:max-w-[200px]">{b.route}</span>
                      )}
                      <span className="tabular-nums shrink-0">{relativeTime(b.createdAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Showing {allBugs.length} of {total}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleLoadMore}
                  disabled={listLoading}
                >
                  {listLoading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="pr-8 break-words">{selected?.title}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 text-sm">

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-xs leading-relaxed">
                  {selected.description}
                </p>
              </div>

              {/* Screenshots */}
              {selectedAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Screenshots</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAttachments.map((a, i) => (
                      <a
                        key={`${a.fileName}-${i}`}
                        href={attachmentDataUrl(a)}
                        download={a.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-md border border-border/60 bg-muted/20 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachmentDataUrl(a)}
                          alt={a.fileName}
                          loading="lazy"
                          className="h-32 w-full object-contain bg-muted/30"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected / Actual */}
              {selected.expected && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Expected</Label>
                  <p className="whitespace-pre-wrap break-words text-xs">{selected.expected}</p>
                </div>
              )}
              {selected.actual && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Actual</Label>
                  <p className="whitespace-pre-wrap break-words text-xs">{selected.actual}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid gap-2 text-xs text-muted-foreground">
                {selected.reporterEmail && (
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground shrink-0">Reporter:</span>
                    <a
                      href={`mailto:${selected.reporterEmail}`}
                      className="text-primary hover:underline break-all"
                    >
                      {selected.reporterEmail}
                    </a>
                  </div>
                )}
                {selected.route && (
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground shrink-0">Route:</span>
                    <Link
                      href={selected.route}
                      onClick={() => handleDialogClose(false)}
                      className="text-primary hover:underline font-mono text-[11px] break-all"
                    >
                      {selected.route}
                    </Link>
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-foreground shrink-0">ID:</span>
                  <code className="text-[11px] break-all flex-1">{selected.id}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyId(selected.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    {copied
                      ? <Check className="size-3.5 text-green-500" />
                      : <ClipboardCopy className="size-3.5" />
                    }
                  </button>
                </div>
                <div>
                  <span className="font-medium text-foreground">Submitted:</span>{" "}
                  {relativeTime(selected.createdAt)} · {new Date(selected.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Status selector */}
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleDialogClose(false)}
            >
              {hasUnsaved ? "Discard & close" : "Close"}
            </Button>
            <Button
              type="button"
              disabled={!selected || updateMutation.isPending || editStatus === selected?.status}
              onClick={() => {
                if (!selected) return;
                updateMutation.mutate({ id: selected.id, body: { status: editStatus } });
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
