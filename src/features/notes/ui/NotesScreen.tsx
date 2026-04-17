"use client";

import { Plus, Trash2, FileText } from "lucide-react";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { cn } from "@/app/components/ui/utils";
import { ScreenSkeleton } from "@/app/components/ScreenSkeleton";
import { useNotesScreen } from "../hooks/useNotesScreen";
import { NoteEditor } from "./NoteEditor";

export function NotesScreen() {
  const {
    workspaceId,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
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
    handleTagsChange,
    handleLinkTask,
    ensureTasksLoaded,
    handleConvertToTask,
    handleLoadMore,
  } = useNotesScreen();

  if (isLoading) {
    return <ScreenSkeleton variant="notes" />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-3rem)] lg:h-screen -m-5 lg:-m-6">
      {/* Sidebar */}
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

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border/40">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Note list */}
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

      {/* Editor pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdate}
            onTagsChange={handleTagsChange}
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
    </div>
  );
}
