"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Bold,
  CheckSquare,
  Italic,
  Loader2,
  Sparkles,
  Strikethrough,
  Link as LinkIcon,
} from "lucide-react";
import { LinkedItems, renderRelation } from "@/app/components/linking/LinkPicker";
import type { Task } from "@/lib/types";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import { TagChip } from "@/app/components/tags/TagChip";
import { TagInput } from "@/app/components/tags/TagInput";
import type { NoteEditorProps } from "../model/types";
import { NoteEditorToolbar } from "./NoteEditorToolbar";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

function readImageAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

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
      StarterKit.configure({
        // Provided by our own extensions below so we can style / configure them.
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      Placeholder.configure({ placeholder: "Start writing, or paste an image…" }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "note-inline-image" },
        resize: {
          enabled: true,
          minWidth: 80,
          minHeight: 40,
          alwaysPreserveAspectRatio: true,
        },
      }),
      TaskList.configure({
        HTMLAttributes: { class: "task-list" },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "task-item" },
      }),
    ],
    content: note.content ?? "",
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            if (file.size > MAX_IMAGE_BYTES) {
              toast.error("Image is too large (max 1.5 MB)");
              return true;
            }
            event.preventDefault();
            readImageAsDataUrl(file).then((src) => {
              if (!src) {
                toast.error("Could not read the pasted image");
                return;
              }
              const { state, dispatch } = view;
              const node = view.state.schema.nodes.image.create({ src });
              dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
            });
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error("Image is too large (max 1.5 MB)");
          return true;
        }
        event.preventDefault();
        readImageAsDataUrl(file).then((src) => {
          if (!src) {
            toast.error("Could not read the dropped image");
            return;
          }
          const coords = { left: event.clientX, top: event.clientY };
          const pos = view.posAtCoords(coords);
          const tr = view.state.tr;
          const node = view.state.schema.nodes.image.create({ src });
          if (pos) {
            tr.insert(pos.pos, node);
          } else {
            tr.replaceSelectionWith(node);
          }
          view.dispatch(tr.scrollIntoView());
        });
        return true;
      },
    },
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

      <NoteEditorToolbar editor={editor} />

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
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("strike")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Strikethrough"
            >
              <Strikethrough className="size-3.5" />
            </button>
            <div className="w-px h-4 bg-border/60 mx-0.5" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const prev = editor.getAttributes("link").href as string | undefined;
                const url = window.prompt("URL", prev ?? "https://");
                if (url === null) return;
                if (url === "") {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  return;
                }
                const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: safe })
                  .run();
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("link")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              title="Link"
            >
              <LinkIcon className="size-3.5" />
            </button>
          </BubbleMenu>
        )}

        <EditorContent
          editor={editor}
          className="note-prose prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/40 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
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
