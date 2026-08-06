"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  LayoutGrid,
  List as ListIcon,
  Plus,
  SlidersHorizontal,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/components/ui/utils";
import { ScreenLoader } from "@/app/components/ScreenLoader";
import { ManageTagsDialog } from "@/app/components/tags/ManageTagsDialog";
import { useNotesScreen } from "../hooks/useNotesScreen";
import { groupNotesByDate } from "../lib/groupNotesByDate";
import type { ActiveSection, NotesViewMode } from "../model/types";
import { NoteGridCard } from "./NoteGridCard";
import { NoteEditorOverlay } from "./NoteEditorOverlay";
import { NotesRail } from "./NotesRail";

const NoteEditor = dynamic(
  () => import("./NoteEditor").then((m) => ({ default: m.NoteEditor })),
  { ssr: false, loading: () => <ScreenLoader variant="app" /> },
);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const VIEW_MODE_STORAGE_KEY = "notes:viewMode";

export function NotesScreen() {
  const {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
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
  const [mobileRailOpen, setMobileRailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<NotesViewMode>("grid");

  // The overlay is opened explicitly (click / create) rather than derived from
  // selection — the selection hook auto-selects the first note whenever the
  // list loads, which would otherwise pop a note open on every visit.
  const [editorOpen, setEditorOpen] = useState(false);

  const existingTagLabels = useMemo(() => allTags.map((t) => t.tag), [allTags]);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  const changeViewMode = useCallback((mode: NotesViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  }, []);

  // Recent = last 7 days, filtered from the loaded page (unchanged behaviour).
  const recentNotes = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return notes.filter((n) => new Date(n.updatedAt).getTime() >= cutoff);
  }, [notes]);

  const visibleNotes = activeSection.type === "recent" ? recentNotes : notes;
  const noteGroups = useMemo(() => groupNotesByDate(visibleNotes), [visibleNotes]);

  const selectSection = useCallback(
    (section: ActiveSection) => {
      setActiveSection(section);
      setMobileRailOpen(false);
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
    },
    [setFilterProjectId, setSelectedTags],
  );

  const openNote = useCallback(
    (id: string) => {
      setSelectedNoteId(id);
      setEditorOpen(true);
    },
    [setSelectedNoteId],
  );

  const createNote = useCallback(() => {
    handleCreateNote();
    setEditorOpen(true);
  }, [handleCreateNote]);

  const closeEditor = useCallback(() => setEditorOpen(false), []);

  const deleteNote = useCallback(
    (id: string) => {
      if (id === selectedNoteId) setEditorOpen(false);
      handleDelete(id);
    },
    [handleDelete, selectedNoteId],
  );

  // Close when nothing is selected at all.
  //
  // This deliberately keys off selectedNoteId rather than the resolved note:
  // on create, the id is set to a temp id one render before React Query's
  // onMutate inserts the optimistic note, so `selectedNote` is briefly null
  // while the id is already valid. Guarding on the note closed the editor in
  // that window and it never reopened. Deletion closes explicitly in
  // deleteNote(), so nothing depends on this for that case.
  useEffect(() => {
    if (editorOpen && !selectedNoteId) setEditorOpen(false);
  }, [editorOpen, selectedNoteId]);

  const activeFilterLabel = useMemo(() => {
    if (activeSection.type === "project") {
      return allProjects.find((p) => p.id === activeSection.id)?.name ?? "Project";
    }
    if (activeSection.type === "tag") return `#${activeSection.tag}`;
    if (activeSection.type === "recent") return "Recent";
    return null;
  }, [activeSection, allProjects]);

  const railProps = {
    activeSection,
    onSelectSection: selectSection,
    totalCount: total,
    recentCount: recentNotes.length,
    projects: allProjects,
    tags: allTags,
    projectsExpanded,
    onToggleProjects: () => setProjectsExpanded((v) => !v),
    tagsExpanded,
    onToggleTags: () => setTagsExpanded((v) => !v),
    onManageTags: () => setManageOpen(true),
    onCreateNote: createNote,
    createDisabled: createIsPending || !workspaceId,
  };

  return (
    <div className="-m-5 flex h-[calc(100vh-3rem)] lg:-m-6 lg:h-screen">
      {/* ── Rail (desktop) ──────────────────────────────────────────────── */}
      <NotesRail {...railProps} className="hidden w-60 shrink-0 lg:flex xl:w-64" />

      {/* ── Rail (mobile slide-over) ────────────────────────────────────── */}
      {/* z-50: the app's top bar outranks z-40 and would clip the rail header. */}
      {mobileRailOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileRailOpen(false)}
            className="absolute inset-0 cursor-default bg-background/60 backdrop-blur-sm"
          />
          <NotesRail
            {...railProps}
            primary={false}
            className="relative h-full w-72 max-w-[85vw] shadow-xl animate-in slide-in-from-left duration-200"
          />
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-3 py-2 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="size-8 shrink-0 p-0 lg:hidden"
            onClick={() => setMobileRailOpen(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="size-4" />
          </Button>

          <div className="min-w-0 max-w-md flex-1">
            <SearchInput
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notes"
              className="h-8 text-xs"
            />
          </div>

          {activeFilterLabel && (
            <button
              type="button"
              onClick={() => selectSection({ type: "all" })}
              className="hidden shrink-0 cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              title="Clear filter"
            >
              <span className="max-w-[10rem] truncate">{activeFilterLabel}</span>
              <X className="size-3" />
            </button>
          )}

          <div className="flex-1" />

          <span className="hidden shrink-0 text-[11px] tabular-nums text-muted-foreground/70 sm:inline">
            {visibleNotes.length} of {total}
          </span>

          {/* View toggle */}
          <div className="flex shrink-0 items-center rounded-md border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => changeViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className={cn(
                "cursor-pointer rounded p-1 transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => changeViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={cn(
                "cursor-pointer rounded p-1 transition-colors",
                viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListIcon className="size-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            onClick={createNote}
            disabled={createIsPending || !workspaceId}
            title="New note"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {/* Gallery */}
        <div className="flex-1 overflow-y-auto px-3 pb-10 sm:px-4">
          {isLoading && notes.length === 0 && (
            <div className="py-16">
              <ScreenLoader variant="app" />
            </div>
          )}

          {error && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-muted-foreground">
              <WifiOff className="size-7 opacity-40" />
              <p className="text-sm font-medium">
                {typeof navigator !== "undefined" && !navigator.onLine
                  ? "You're offline"
                  : "Failed to load notes"}
              </p>
              <p className="text-xs opacity-60">
                {typeof navigator !== "undefined" && !navigator.onLine
                  ? "Connect to the internet to load your notes"
                  : "Check your connection and try again"}
              </p>
            </div>
          )}

          {!error && !isLoading && visibleNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
              <FileText className="mb-3 size-10 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">
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
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={createNote}
                disabled={!workspaceId}
              >
                <Plus className="size-3.5" />
                Create one
              </Button>
            </div>
          )}

          {noteGroups.map(({ label, notes: groupNotes }) => (
            <section key={label} className="mt-5 first:mt-4">
              <h2 className="mb-2 select-none px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                {label}
              </h2>

              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "mx-auto flex max-w-3xl flex-col gap-1",
                )}
              >
                {groupNotes.map((note) => (
                  <div key={note.id} className="relative group">
                    {viewMode === "grid" ? (
                      <NoteGridCard
                        note={note}
                        isActive={selectedNoteId === note.id}
                        onSelect={openNote}
                      />
                    ) : (
                      <NoteCard
                        note={note}
                        isActive={selectedNoteId === note.id}
                        onSelect={openNote}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className={cn(
                        "absolute rounded p-1 text-muted-foreground opacity-0 transition-all",
                        "hover:bg-background/80 hover:text-destructive focus-visible:opacity-100",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                        viewMode === "grid"
                          ? "right-2 top-2 cursor-pointer bg-background/70 backdrop-blur-sm"
                          : "bottom-2 right-3 cursor-pointer",
                      )}
                      aria-label={`Delete note: ${note.title || "Untitled"}`}
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {notes.length < total && activeSection.type !== "recent" && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load more ({notes.length} / {total})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Focused editor ──────────────────────────────────────────────── */}
      <NoteEditorOverlay
        note={editorOpen ? selectedNote : null}
        onClose={closeEditor}
        onDelete={deleteNote}
      >
        {editorOpen && selectedNote && (
          <NoteEditor
            note={selectedNote}
            existingTags={existingTagLabels}
            onUpdate={handleUpdate}
            onAddTags={handleAddTags}
            onRemoveTag={handleRemoveTag}
            onTagClick={(tag) => {
              closeEditor();
              selectSection({ type: "tag", tag });
            }}
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
        )}
      </NoteEditorOverlay>

      <ManageTagsDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        workspaceId={workspaceId}
      />
    </div>
  );
}
