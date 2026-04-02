"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Bold, Italic, List, ListOrdered, Tag, MoreVertical, Trash2, Loader2 } from "lucide-react";
import type { Note } from "@/lib/types";
import { NoteCard } from "@/app/components/NoteCard";
import { Button } from "@/app/components/ui/button";
import { SearchInput } from "@/app/components/ui/search-input";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { toast } from "sonner";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import {
  useNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/app/hooks/useNotesApi";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

function NoteEditor({
  note,
  onUpdate,
}: {
  note: Note;
  onUpdate: (id: string, changes: { title?: string; content?: string }) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: note.content ?? "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(note.id, { content: html });
      }, 1000);
    },
  });

  // Sync content when switching notes
  useEffect(() => {
    if (editor && note.content !== undefined) {
      const current = editor.getHTML();
      if (current !== (note.content ?? "")) {
        editor.commands.setContent(note.content ?? "");
      }
    }
    setTitle(note.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  const handleTitleBlur = () => {
    if (title.trim() !== note.title) {
      onUpdate(note.id, { title: title.trim() });
    }
  };

  const charCount = editor?.getText().length ?? 0;

  return (
    <>
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button
              variant={editor?.isActive("bold") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              variant={editor?.isActive("italic") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic className="size-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant={editor?.isActive("bulletList") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="size-3.5" />
            </Button>
            <Button
              variant={editor?.isActive("orderedList") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Ordered List"
            >
              <ListOrdered className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <MoreVertical className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {note.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              <Tag className="size-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Note title..."
          className="text-xl font-bold border-0 p-0 mb-3 focus-visible:ring-0"
        />
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none min-h-[320px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[320px]"
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Last edited {new Date(note.updatedAt).toLocaleString()}</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </>
  );
}

export function Notes() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notes = [], isLoading, error } = useNotesQuery(workspaceId, {
    search: searchQuery || undefined,
  });

  const createMutation = useCreateNoteMutation(workspaceId, {
    onSuccess: (note) => {
      setSelectedNoteId(note.id);
      toast.success("Note created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useUpdateNoteMutation(workspaceId, {
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useDeleteNoteMutation(workspaceId, {
    onSuccess: (_, id) => {
      if (selectedNoteId === id) {
        setSelectedNoteId(notes.find((n) => n.id !== id)?.id ?? null);
      }
      toast.success("Note deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-select first note
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  const handleCreateNote = () => {
    if (!workspaceId) return;
    createMutation.mutate({ title: "Untitled Note", tags: [] });
  };

  const handleUpdate = useCallback(
    (id: string, changes: { title?: string; content?: string }) => {
      updateMutation.mutate({ id, body: changes });
    },
    [updateMutation]
  );

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this note?")) return;
    deleteMutation.mutate(id);
  };

  const noteToCard = (note: Note): Note => ({
    ...note,
    preview: note.content
      ? note.content.replace(/<[^>]+>/g, "").slice(0, 120)
      : "",
    lastEdited: new Date(note.updatedAt).toLocaleDateString(),
  });

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Notes List */}
        <div className="lg:min-w-72 lg:w-80 xl:w-96 flex-shrink-0 space-y-3 flex flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Notes</h1>
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={createMutation.isPending || !workspaceId}
            >
              {createMutation.isPending ? (
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
                      note={noteToCard(note)}
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
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {selectedNote ? (
            <NoteEditor key={selectedNote.id} note={selectedNote} onUpdate={handleUpdate} />
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
