"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Trash2, FileText, X } from "lucide-react";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/components/ui/utils";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { TagChip } from "@/app/components/tags/TagChip";
import { ManageTagsDialog } from "@/app/components/tags/ManageTagsDialog";
import { useNotesScreen } from "../hooks/useNotesScreen";
import { NoteEditor } from "./NoteEditor";

const INLINE_TAG_LIMIT = 8;

export function NotesScreen() {
  const {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    toggleTag,
    tagMode,
    setTagMode,
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
    ensureTasksLoaded,
    handleConvertToTask,
    handleLoadMore,
  } = useNotesScreen();

  const [manageOpen, setManageOpen] = useState(false);

  const existingTagLabels = useMemo(
    () => allTags.map((t) => t.tag),
    [allTags],
  );

  const inlineTags = allTags.slice(0, INLINE_TAG_LIMIT);
  const hasOverflow = allTags.length > INLINE_TAG_LIMIT;

  if (isLoading) {
    return <ScreenSkeleton variant="notes" />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3rem)] lg:h-screen -m-5 lg:-m-6">
      <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col border-r border-border/60 bg-[var(--sidebar-bg)]">
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

        <div className="px-3 py-2 border-b border-border/40">
          <SearchInput
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search notes"
            className="h-7 text-xs"
          />
        </div>

        {allTags.length > 0 && (
          <div
            className="flex flex-col gap-2 px-3 py-2 border-b border-border/40"
            data-testid="tag-filter-bar"
          >
            {selectedTags.length > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-md bg-accent/40 px-2 py-1.5"
                data-testid="tag-filter-active"
              >
                <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                  Filtering by
                </span>
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {selectedTags.map((tag) => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      size="xs"
                      active
                      onClick={toggleTag}
                      onRemove={toggleTag}
                      ariaLabel={`Remove ${tag} filter`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 shrink-0 px-1.5 h-5 rounded-full hover:bg-background"
                  data-testid="tag-filter-clear"
                  aria-label="Clear all filters"
                >
                  <X className="size-3" />
                  Clear
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1 items-center">
              {inlineTags.map(({ tag, count }) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  count={count}
                  size="xs"
                  active={selectedTags.includes(tag)}
                  onClick={toggleTag}
                />
              ))}
              {hasOverflow && (
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full border border-dashed"
                  data-testid="tag-filter-overflow"
                  aria-label="Manage tags"
                >
                  <MoreHorizontal className="size-3" />
                  +{allTags.length - INLINE_TAG_LIMIT}
                </button>
              )}
              {!hasOverflow && allTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full border border-dashed"
                  data-testid="tag-filter-manage"
                  aria-label="Manage tags"
                >
                  Manage
                </button>
              )}
            </div>
            {selectedTags.length >= 2 && (
              <div
                className="inline-flex self-start items-center gap-0.5 text-[10px] rounded-full border"
                role="group"
                aria-label="Tag match mode"
                data-testid="tag-mode-toggle"
              >
                <button
                  type="button"
                  onClick={() => setTagMode("all")}
                  aria-pressed={tagMode === "all"}
                  data-testid="tag-mode-all"
                  className={cn(
                    "px-2 h-5 rounded-full transition-colors",
                    tagMode === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode("any")}
                  aria-pressed={tagMode === "any"}
                  data-testid="tag-mode-any"
                  className={cn(
                    "px-2 h-5 rounded-full transition-colors",
                    tagMode === "any"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Any
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {error && <p className="text-xs text-destructive text-center py-4">Failed to load</p>}
          {!error && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground">No notes yet</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleCreateNote} disabled={!workspaceId}>
                <Plus className="size-3" /> Create one
              </Button>
            </div>
          )}
          {!error && notes.map((note) => (
            <div key={note.id} className="relative group px-2">
              <NoteCard
                note={note}
                isActive={selectedNoteId === note.id}
                onSelect={setSelectedNoteId}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                title="Delete note"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {!error && notes.length < total && (
            <button
              onClick={handleLoadMore}
              className="w-full text-[11px] text-center py-2 text-muted-foreground hover:text-foreground"
            >
              Load more ({notes.length} / {total})
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            existingTags={existingTagLabels}
            onUpdate={handleUpdate}
            onAddTags={handleAddTags}
            onRemoveTag={handleRemoveTag}
            onTagClick={(tag) => toggleTag(tag)}
            onLinkTask={handleLinkTask}
            onOpenTaskPicker={ensureTasksLoaded}
            onConvertToTask={handleConvertToTask}
            isSaving={updateIsPending}
            tasksLoading={tasksLoading}
            tasks={allTasks}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <FileText className="size-10 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">
              {workspaceId ? "Select a note or create a new one" : "Select a workspace to view notes"}
            </p>
            {workspaceId && (
              <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateNote} disabled={createIsPending}>
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
