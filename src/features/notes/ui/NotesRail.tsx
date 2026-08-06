"use client";

import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Tag,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import type { Project } from "@/lib/types";
import type { WorkspaceTag } from "@/lib/api/tags-api";
import type { ActiveSection } from "../model/types";

// ─── Primitives ──────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  expanded,
  onToggle,
  action,
  actionTestId,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  action?: { label: string; onClick: () => void };
  actionTestId?: string;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        {label}
      </button>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="cursor-pointer text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground"
          data-testid={actionTestId}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      <span className="flex-1 truncate">{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "shrink-0 text-[10px] tabular-nums",
            active ? "text-primary/70" : "text-muted-foreground/50",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Rail ────────────────────────────────────────────────────────────────────

interface NotesRailProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  totalCount: number;
  recentCount: number;
  projects: Project[];
  tags: WorkspaceTag[];
  projectsExpanded: boolean;
  onToggleProjects: () => void;
  tagsExpanded: boolean;
  onToggleTags: () => void;
  onManageTags: () => void;
  onCreateNote: () => void;
  createDisabled: boolean;
  className?: string;
  /**
   * The mobile drawer mounts a second copy of this rail while the desktop one
   * is still in the DOM (display:none). Only the primary instance emits test
   * ids and the labelled create button, so selectors stay unique.
   */
  primary?: boolean;
}

export function NotesRail({
  activeSection,
  onSelectSection,
  totalCount,
  recentCount,
  projects,
  tags,
  projectsExpanded,
  onToggleProjects,
  tagsExpanded,
  onToggleTags,
  onManageTags,
  onCreateNote,
  createDisabled,
  className,
  primary = true,
}: NotesRailProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/60 bg-[var(--sidebar-bg)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3">
        <h1 className="text-sm font-semibold">Notes</h1>
        {/* aria-label rather than title: the toolbar's New button owns the
            "New note" title attribute so there is exactly one on the page. */}
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={onCreateNote}
          disabled={createDisabled}
          aria-label={primary ? "Create note" : undefined}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Single scroll region — the whole rail scrolls as one */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          <NavItem
            icon={FileText}
            label="All Notes"
            count={totalCount}
            active={activeSection.type === "all"}
            onClick={() => onSelectSection({ type: "all" })}
          />
          <NavItem
            icon={Clock}
            label="Recent"
            count={recentCount}
            active={activeSection.type === "recent"}
            onClick={() => onSelectSection({ type: "recent" })}
          />
        </div>

        {projects.length > 0 && (
          <div className="mt-3">
            <SectionHeader
              label="Projects"
              expanded={projectsExpanded}
              onToggle={onToggleProjects}
            />
            {projectsExpanded && (
              <div className="space-y-0.5">
                {projects.map((project) => (
                  <NavItem
                    key={project.id}
                    icon={FolderOpen}
                    label={project.name}
                    count={project._count?.notes}
                    active={
                      activeSection.type === "project" &&
                      activeSection.id === project.id
                    }
                    onClick={() =>
                      onSelectSection({ type: "project", id: project.id })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-3 pb-2">
            <SectionHeader
              label="Tags"
              expanded={tagsExpanded}
              onToggle={onToggleTags}
              action={{ label: "Manage", onClick: onManageTags }}
              actionTestId={primary ? "tag-filter-manage" : undefined}
            />
            {tagsExpanded && (
              <div
                className="space-y-0.5"
                data-testid={primary ? "tag-filter-bar" : undefined}
              >
                {tags.map(({ tag, count }) => {
                  const isActive =
                    activeSection.type === "tag" && activeSection.tag === tag;
                  return (
                    <NavItem
                      key={tag}
                      icon={Tag}
                      label={tag}
                      count={count}
                      active={isActive}
                      onClick={() =>
                        onSelectSection(
                          isActive ? { type: "all" } : { type: "tag", tag },
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
