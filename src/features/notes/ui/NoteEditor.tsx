"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Bold,
  Italic,
  Link2,
  LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Unlink,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import { TagChip } from "@/app/components/tags/TagChip";
import { TagInput } from "@/app/components/tags/TagInput";
import type { NoteEditorProps } from "../model/types";

export function NoteEditor({
  note,
  existingTags,
  onUpdate,
  onAddTags,
  onRemoveTag,
  onTagClick,
  onLinkTask,
  onOpenTaskPicker,
  onConvertToTask,
  isSaving,
  tasksLoading = false,
  tasks,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const linkedTask = tasks.find((t) => t.id === note.taskId) ?? null;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing…" }),
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
    setShowTaskPicker(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key !== "t" && event.key !== "T") return;
      const input = tagInputRef.current;
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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

  const handleAdd = useCallback(
    (tags: string[]) => {
      onAddTags(note.id, tags);
    },
    [note.id, onAddTags],
  );

  const handleRemove = useCallback(
    (tag: string) => {
      onRemoveTag(note.id, tag);
      toast.success(`Removed "${tag}"`, {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => onAddTags(note.id, [tag]),
        },
      });
    },
    [note.id, onAddTags, onRemoveTag],
  );

  return (
    <div ref={paneRef} tabIndex={-1} className="flex flex-col h-full outline-none">
      <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/40 shrink-0">
        <div
          className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0"
          data-testid="editor-tag-row"
        >
          {note.tags?.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              size="sm"
              onClick={onTagClick ? (t) => onTagClick(t) : undefined}
              onRemove={handleRemove}
            />
          ))}
          <TagInput
            ref={tagInputRef}
            existingTags={existingTags}
            selectedTags={note.tags ?? []}
            onAdd={handleAdd}
            placeholder="Add tag (Alt+T)"
            dataTestId="editor-tag-input"
          />
        </div>

        <div className="relative flex items-center gap-2 shrink-0">
          {!note.taskId && (
            <button
              onClick={() => onConvertToTask(note.id)}
              className="text-[10px] text-muted-foreground/60 hover:text-primary flex items-center gap-0.5 transition-colors"
              title="Convert note to task"
            >
              To task
            </button>
          )}
          {linkedTask || note.taskId ? (
            <div className="flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <Link2 className="size-3" />
              <span className="max-w-28 truncate">
                {linkedTask ? linkedTask.title : "Linked task"}
              </span>
              <button
                onClick={() => onLinkTask(note.id, null)}
                className="hover:text-destructive transition-colors"
                title="Unlink task"
              >
                <Unlink className="size-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenTaskPicker?.();
                setShowTaskPicker((v) => !v);
              }}
              className="text-[10px] text-muted-foreground/60 hover:text-primary flex items-center gap-0.5 transition-colors"
              title="Link to a task"
            >
              <LinkIcon className="size-3" />
              Link task
            </button>
          )}
          {showTaskPicker && (
            <div className="absolute right-0 top-6 z-10 bg-background border border-border/60 rounded-lg shadow-md w-56 max-h-48 overflow-y-auto">
              {tasksLoading ? (
                <p className="text-xs text-muted-foreground p-3">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">No tasks in workspace</p>
              ) : (
                tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onLinkTask(note.id, t.id);
                      setShowTaskPicker(false);
                    }}
                    className="w-full text-left text-xs px-3 py-2 hover:bg-muted/50 truncate transition-colors"
                  >
                    {t.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="w-full text-2xl font-semibold bg-transparent outline-none placeholder:text-muted-foreground/30 mb-4 leading-tight"
        />

        {editor && (
          <BubbleMenu
            editor={editor}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background border border-border/60 shadow-md"
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-colors",
                editor.isActive("bold")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Bold (⌘B)"
            >
              <Bold className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("italic")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Italic (⌘I)"
            >
              <Italic className="size-3.5" />
            </button>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("bulletList")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Bullet list"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("orderedList")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Ordered list"
            >
              <ListOrdered className="size-3.5" />
            </button>
          </BubbleMenu>
        )}

        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/40 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>

      <div className="px-6 py-2.5 border-t border-border/40 shrink-0">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Saving…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Saved</span>
        )}
      </div>
    </div>
  );
}
