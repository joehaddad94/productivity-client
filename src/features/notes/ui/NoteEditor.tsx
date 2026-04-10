"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Bold,
  Italic,
  Link2,
  LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Tag,
  Unlink,
  X,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import type { NoteEditorProps } from "../model/types";

export function NoteEditor({
  note,
  onUpdate,
  onTagsChange,
  onLinkTask,
  isSaving,
  tasks,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const linkedTask = tasks.find((t) => t.id === note.taskId) ?? null;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: note.content ?? "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = setTimeout(() => {
        onUpdate(note.id, { content: html });
      }, 1000);
    },
  });

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

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, []);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      if (newTitle.trim() && newTitle.trim() !== note.title) {
        onUpdate(note.id, { title: newTitle.trim() });
      }
    }, 1000);
  };

  const handleTitleBlur = () => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    if (title.trim() && title.trim() !== note.title) {
      onUpdate(note.id, { title: title.trim() });
    }
  };

  const charCount = editor?.getText().length ?? 0;

  return (
    <>
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
          <div className="relative flex items-center gap-1">
            {linkedTask ? (
              <div className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Link2 className="size-3" />
                <span className="max-w-28 truncate">{linkedTask.title}</span>
                <button
                  onClick={() => onLinkTask(note.id, null)}
                  className="hover:text-red-500 transition-colors"
                  title="Unlink task"
                >
                  <Unlink className="size-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTaskPicker((v) => !v)}
                className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-0.5 transition-colors"
                title="Link to a task"
              >
                <LinkIcon className="size-3" />
                Link task
              </button>
            )}
            {showTaskPicker && (
              <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-56 max-h-48 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-xs text-gray-500 p-3">No tasks in workspace</p>
                ) : (
                  tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onLinkTask(note.id, t.id);
                        setShowTaskPicker(false);
                      }}
                      className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 truncate"
                    >
                      {t.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {note.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] gap-1 pr-1 cursor-default"
            >
              <Tag className="size-2.5" />
              {tag}
              <button
                onClick={() =>
                  onTagsChange(note.id, (note.tags ?? []).filter((t) => t !== tag))
                }
                className="ml-0.5 hover:text-red-500 transition-colors"
                title={`Remove tag "${tag}"`}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
          {isAddingTag ? (
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !(note.tags ?? []).includes(tag)) {
                    onTagsChange(note.id, [...(note.tags ?? []), tag]);
                  }
                  setTagInput("");
                  setIsAddingTag(false);
                }
                if (e.key === "Escape") {
                  setTagInput("");
                  setIsAddingTag(false);
                }
              }}
              onBlur={() => {
                const tag = tagInput.trim().toLowerCase();
                if (tag && !(note.tags ?? []).includes(tag)) {
                  onTagsChange(note.id, [...(note.tags ?? []), tag]);
                }
                setTagInput("");
                setIsAddingTag(false);
              }}
              placeholder="tag name…"
              className="text-[11px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/5 focus:outline-none focus:border-primary w-24"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setIsAddingTag(true);
                setTimeout(() => tagInputRef.current?.focus(), 0);
              }}
              className="text-[10px] text-gray-400 hover:text-primary flex items-center gap-0.5 transition-colors"
              title="Add tag"
            >
              <Plus className="size-3" />
              Add tag
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <Input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Note title..."
          className="text-xl font-bold border-0 p-0 mb-3 focus-visible:ring-0"
        />
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none min-h-[320px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[320px]"
        />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {isSaving ? (
            <span className="flex items-center gap-1 text-primary">
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </span>
          ) : (
            <span>Last edited {new Date(note.updatedAt).toLocaleString()}</span>
          )}
          <span>{charCount} characters</span>
        </div>
      </div>
    </>
  );
}
