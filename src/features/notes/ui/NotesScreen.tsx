"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  FileText,
  FolderOpen,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ManageTagsDialog } from "@/app/components/tags/ManageTagsDialog";
import { useNotesScreen } from "../hooks/useNotesScreen";
import { groupNotesByDate } from "../lib/groupNotesByDate";
import { NoteEditor } from "./NoteEditor";
import { NotesSidebarNavItem, NotesSidebarSectionHeader } from "./NotesScreenNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveSection =
  | { type: "all" }
  | { type: "recent" }
  | { type: "project"; id: string }
  | { type: "tag"; tag: string };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NAV_PROJECTS = 6;
const MAX_NAV_TAGS = 6;

export function NotesScreen() {
  const {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    filterProjectId,
    setFilterProjectId,
    allTags,
    notes,
    total,
    allTasks,
    tasksLoading,
    selectedNote,
    isLoading,
    error,
    createIsPending,
    updateIsPending,
    handleCreateNote,
    handleDelete,
    handleUpdate,
    handleAddTags,
    handleRemoveTag,
    handleLinkTask,
    linkingTaskNoteIds,
    ensureTasksLoaded,
    allProjects,
    projectsLoading,
    handleLinkProject,
    linkingProjectNoteIds,
    ensureProjectsLoaded,
    handleConvertToTask,
    convertingNoteIds,
    handleLoadMore,
  } = useNotesScreen();

  const [manageOpen, setManageOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>({ type: "all" });
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const existingTagLabels = useMemo(() => allTags.map((t) => t.tag), [allTags]);

  // Recent = last 7 days, filtered client-side from loaded notes
  const recentNotes = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return notes.filter((n) => new Date(n.updatedAt).getTime() >= cutoff);
  }, [notes]);

  const visibleNotes = activeSection.type === "recent" ? recentNotes : notes;
  const noteGroups = useMemo(() => groupNotesByDate(visibleNotes), [visibleNotes]);

  // Apply a section: update both local UI state and hook filter state
  function selectSection(section: ActiveSection) {
    setActiveSection(section);
    if (section.type === "project") {
      setFilterProjectId(section.id);
      setSelectedTags([]);
    } else if (section.type === "tag") {
      setSelectedTags([section.tag]);
      setFilterProjectId(null);
    } else {
      setFilterProjectId(null);
      setSelectedTags([]);
    }
  }

  if (isLoading) return <ScreenLoader variant="app" />;

  const navProjects = allProjects.slice(0, MAX_NAV_PROJECTS);
  const hiddenProjectCount = Math.max(0, allProjects.length - MAX_NAV_PROJECTS);
  const navTags = allTags.slice(0, MAX_NAV_TAGS);
  const hiddenTagCount = Math.max(0, allTags.length - MAX_NAV_TAGS);

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3rem)] lg:h-screen -m-5 lg:-m-6">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col border-r border-border/60 bg-[var(--sidebar-bg)]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h1 className="text-sm font-semibold">Notes</h1>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCreateNote}
            disabled={createIsPending || !workspaceId}
            title="New note"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/40">
          <SearchInput
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search notes"
            className="h-7 text-xs"
          />
        </div>

        {/* Navigation */}
        <div className="border-b border-border/40 overflow-y-auto shrink-0 max-h-72">

          {/* All / Recent */}
          <div className="px-2 pt-2 pb-1 space-y-0.5">
            <NotesSidebarNavItem
              icon={FileText}
              label="All Notes"
              count={total}
              active={activeSection.type === "all"}
              onClick={() => selectSection({ type: "all" })}
            />
            <NotesSidebarNavItem
              icon={Clock}
              label="Recent"
              count={recentNotes.length}
              active={activeSection.type === "recent"}
              onClick={() => selectSection({ type: "recent" })}
            />
          </div>

          {/* By Project */}
          {allProjects.length > 0 && (
            <div className="px-2 pb-1">
              <NotesSidebarSectionHeader
                label="Projects"
                expanded={projectsExpanded}
                onToggle={() => setProjectsExpanded((v) => !v)}
              />
              {projectsExpanded && (
                <div className="space-y-0.5">
                  {navProjects.map((p) => (
                    <NotesSidebarNavItem
                      key={p.id}
                      icon={FolderOpen}
                      label={p.name}
                      count={p._count?.notes}
                      active={activeSection.type === "project" && activeSection.id === p.id}
                      onClick={() => selectSection({ type: "project", id: p.id })}
                    />
                  ))}
                  {hiddenProjectCount > 0 && (
                    <p className="text-[10px] text-muted-foreground/60 px-2 py-0.5">
                      +{hiddenProjectCount} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* By Tag */}
          {allTags.length > 0 && (
            <div className="px-2 pb-2">
              <NotesSidebarSectionHeader
                label="Tags"
                expanded={tagsExpanded}
                onToggle={() => setTagsExpanded((v) => !v)}
                action={{ label: "Manage", onClick: () => setManageOpen(true) }}
              />
              {tagsExpanded && (
                <div className="space-y-0.5" data-testid="tag-filter-bar">
                  {navTags.map(({ tag, count }) => {
                    const isActive = activeSection.type === "tag" && activeSection.tag === tag;
                    return (
                      <NotesSidebarNavItem
                        key={tag}
                        icon={Tag}
                        label={tag}
                        count={count}
                        active={isActive}
                        onClick={() =>
                          isActive
                            ? selectSection({ type: "all" })
                            : selectSection({ type: "tag", tag })
                        }
                      />
                    );
                  })}
                  {hiddenTagCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setManageOpen(true)}
                      className="text-[10px] text-muted-foreground/60 hover:text-foreground px-2 py-0.5 w-full text-left cursor-pointer transition-colors"
                      data-testid="tag-filter-overflow"
                    >
                      +{hiddenTagCount} more tags
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-1">
          {error && (
            <p className="text-xs text-destructive text-center py-4">Failed to load</p>
          )}

          {!error && visibleNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground">
                {activeSection.type === "recent"
                  ? "No notes in the last 7 days"
                  : activeSection.type === "project"
                    ? "No notes in this project"
                    : activeSection.type === "tag"
                      ? `No notes tagged "${activeSection.tag}"`
                      : searchQuery.trim()
                        ? "No notes match your search"
                        : "No notes yet"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={handleCreateNote}
                disabled={!workspaceId}
              >
                <Plus className="size-3" /> Create one
              </Button>
            </div>
          )}

          {!error &&
            noteGroups.map(({ label, notes: groupNotes }) => (
              <div key={label}>
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide px-4 pt-3 pb-1 select-none">
                  {label}
                </p>
                {groupNotes.map((note) => (
                  <div key={note.id} className="relative group px-2">
                    <NoteCard
                      note={note}
                      isActive={selectedNoteId === note.id}
                      onSelect={setSelectedNoteId}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}

          {!error && notes.length < total && activeSection.type !== "recent" && (
            <button
              onClick={handleLoadMore}
              className="w-full text-[11px] text-center py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Load more ({notes.length} / {total})
            </button>
          )}
        </div>
      </div>

      {/* ── Editor ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            existingTags={existingTagLabels}
            onUpdate={handleUpdate}
            onAddTags={handleAddTags}
            onRemoveTag={handleRemoveTag}
            onTagClick={(tag) => selectSection({ type: "tag", tag })}
            onLinkTask={handleLinkTask}
            onOpenTaskPicker={ensureTasksLoaded}
            isLinkingTask={linkingTaskNoteIds.has(selectedNote.id)}
            onLinkProject={handleLinkProject}
            onOpenProjectPicker={ensureProjectsLoaded}
            isLinkingProject={linkingProjectNoteIds.has(selectedNote.id)}
            projects={allProjects}
            projectsLoading={projectsLoading}
            onConvertToTask={handleConvertToTask}
            isConvertingToTask={convertingNoteIds.has(selectedNote.id)}
            isSaving={updateIsPending}
            tasksLoading={tasksLoading}
            tasks={allTasks}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <FileText className="size-10 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">
              {workspaceId
                ? "Select a note or create a new one"
                : "Select a workspace to view notes"}
            </p>
            {workspaceId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleCreateNote}
                disabled={createIsPending}
              >
                <Plus className="size-3.5" />
                New note
              </Button>
            )}
          </div>
        )}
      </div>

      <ManageTagsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        workspaceId={workspaceId}
      />
    </div>
  );
}
