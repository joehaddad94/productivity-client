"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Bold,
  CheckSquare,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Sparkles,
} from "lucide-react";
import { LinkedItems, renderRelation } from "@/app/components/linking/LinkPicker";
import type { Task } from "@/lib/types";
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
  isLinkingTask = false,
  onConvertToTask,
  isConvertingToTask = false,
  isSaving,
  tasksLoading = false,
  tasks,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
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

  // ---------------------------------------------------------------
  // Relation configs for LinkedItems. Add more (e.g. Project) here
  // without touching the JSX below.
  // ---------------------------------------------------------------
  const taskRelation = useMemo(
    () => ({
      kind: "task",
      singularLabel: "task",
      icon: CheckSquare,
      value: note.taskId ?? null,
      currentItem: linkedTask,
      getId: (t: Task) => t.id,
      getLabel: (t: Task) => t.title,
      getSecondary: (t: Task) =>
        t.status === "completed"
          ? "Completed"
          : t.status === "in_progress"
            ? "In progress"
            : null,
      items: tasks,
      isLoading: tasksLoading,
      onOpenPicker: onOpenTaskPicker,
      onChange: (next: string | null) => onLinkTask(note.id, next),
      isPending: isLinkingTask,
      size: "xs" as const,
    }),
    [
      linkedTask,
      note.id,
      note.taskId,
      tasks,
      tasksLoading,
      onLinkTask,
      onOpenTaskPicker,
      isLinkingTask,
    ],
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

        <div className="flex items-center gap-1.5 shrink-0">
          <LinkedItems relations={[renderRelation(taskRelation)]} />
          {!note.taskId && (
            <button
              type="button"
              onClick={() => onConvertToTask(note.id)}
              disabled={isConvertingToTask}
              aria-busy={isConvertingToTask}
              title="Create a task from this note's title"
              data-testid="convert-to-task"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 h-5 text-[10px] transition-colors",
                isConvertingToTask
                  ? "text-primary bg-primary/10 cursor-wait"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5",
              )}
            >
              {isConvertingToTask ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <Sparkles className="size-2.5" />
              )}
              {isConvertingToTask ? "Creating…" : "To task"}
            </button>
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
