"use client";

import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
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
    handleLoadMore,
  } = useNotesScreen();

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="lg:min-w-72 lg:w-80 xl:w-96 flex-shrink-0 space-y-3 flex flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Notes</h1>
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={createIsPending || !workspaceId}
            >
              {createIsPending ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="size-3.5 mr-1.5" />
              )}
              New
            </Button>
          </div>

          <SearchInput
            type="search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search notes"
          />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary"
                  }`}
                >
                  <Tag className="size-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center py-4">
              Failed to load notes
            </p>
          )}

          {!isLoading && !error && (
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No notes yet. Create one!
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="relative group">
                    <NoteCard
                      note={note}
                      isActive={selectedNoteId === note.id}
                      onSelect={() => setSelectedNoteId(note.id)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition-opacity"
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
              {notes.length < total && (
                <button
                  onClick={handleLoadMore}
                  className="w-full text-xs text-center py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Load more ({notes.length} / {total})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onUpdate={handleUpdate}
              onTagsChange={handleTagsChange}
              onLinkTask={handleLinkTask}
              isSaving={updateIsPending}
              tasks={allTasks}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {workspaceId
                ? "Select a note to start editing"
                : "Select a workspace to view notes"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
