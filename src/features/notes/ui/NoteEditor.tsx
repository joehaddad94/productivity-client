"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useWorkspace } from "@/app/context/WorkspaceContext";
import { useTaskStatusesQuery } from "@/app/hooks/useTaskStatusesApi";
import {
  Bold,
  CheckSquare,
  FolderOpen,
  Italic,
  Loader2,
  Sparkles,
  Strikethrough,
  Link as LinkIcon,
} from "lucide-react";
import { LinkedItems, renderRelation } from "@/app/components/linking/LinkPicker";
import type { Project, Task, TaskStatusDefinition } from "@/lib/types";
import { EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import { TagChip } from "@/app/components/tags/TagChip";
import { TagInput } from "@/app/components/tags/TagInput";
import type { NoteEditorProps } from "../model/types";
import { useNoteEditor } from "../hooks/useNoteEditor";
import { NoteEditorToolbar } from "./NoteEditorToolbar";
import {
  defaultNonTerminalStatusId,
  ensureTaskStatuses,
  isTaskStatusTerminal,
  taskStatusLabel,
} from "@/features/tasks/lib/taskStatusHelpers";

const TITLE_DEBOUNCE_MS = 1000;

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
  onLinkProject,
  onOpenProjectPicker,
  isLinkingProject = false,
  projects = [],
  projectsLoading = false,
  onConvertToTask,
  isConvertingToTask = false,
  isSaving,
  tasksLoading = false,
  tasks,
}: NoteEditorProps) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const { data: rawTaskStatuses = [] } = useTaskStatusesQuery(workspaceId);
  const taskStatuses: TaskStatusDefinition[] = useMemo(
    () => ensureTaskStatuses(workspaceId, rawTaskStatuses),
    [workspaceId, rawTaskStatuses],
  );

  const [title, setTitle] = useState(note.title);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const linkedTask = tasks.find((t) => t.id === note.taskId) ?? null;
  const linkedProject = projects.find((p) => p.id === note.projectId) ?? null;

  const { editor } = useNoteEditor({
    noteId: note.id,
    contentHtml: note.content ?? "",
    onHtmlDebounced: (id, html) => onUpdate(id, { content: html }),
  });

  useEffect(() => {
    setTitle(note.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  useEffect(() => {
    return () => {
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
    }, TITLE_DEBOUNCE_MS);
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

  const taskRelation = useMemo(
    () => ({
      kind: "task",
      singularLabel: "task",
      icon: CheckSquare,
      value: note.taskId ?? null,
      currentItem: linkedTask,
      getId: (t: Task) => t.id,
      getLabel: (t: Task) => t.title,
      getSecondary: (t: Task) => {
        if (isTaskStatusTerminal(t.status, taskStatuses)) {
          return taskStatusLabel(t.status, taskStatuses);
        }
        if (t.status === defaultNonTerminalStatusId(taskStatuses)) {
          return null;
        }
        return taskStatusLabel(t.status, taskStatuses);
      },
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
      taskStatuses,
    ],
  );

  const projectRelation = useMemo(() => {
    if (!onLinkProject) return null;
    const statusLabel = (p: Project) => {
      const s = p.status ?? "active";
      if (s === "on_hold") return "On hold";
      if (s === "completed") return "Completed";
      return "Active";
    };
    return {
      kind: "project",
      singularLabel: "project",
      icon: FolderOpen,
      tone: {
        chipClass:
          "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
        triggerClass: "hover:border-amber-500/40",
      },
      value: note.projectId ?? null,
      currentItem: linkedProject,
      getId: (p: Project) => p.id,
      getLabel: (p: Project) => p.name,
      getSecondary: (p: Project) => statusLabel(p),
      items: projects,
      isLoading: projectsLoading,
      onOpenPicker: onOpenProjectPicker,
      onChange: (next: string | null) => onLinkProject(note.id, next),
      isPending: isLinkingProject,
      size: "xs" as const,
    };
  }, [
    onLinkProject,
    linkedProject,
    note.id,
    note.projectId,
    projects,
    projectsLoading,
    onOpenProjectPicker,
    isLinkingProject,
  ]);

  const linkRelations = useMemo(() => {
    const list = [renderRelation(taskRelation)];
    if (projectRelation) list.push(renderRelation(projectRelation));
    return list;
  }, [taskRelation, projectRelation]);

  return (
    <div ref={paneRef} tabIndex={-1} className="flex flex-col h-full outline-none">
      <NoteEditorToolbar editor={editor} isSaving={isSaving} />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <input
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="w-full text-2xl font-semibold bg-transparent outline-none placeholder:text-muted-foreground/30 mb-3 leading-tight"
        />

        {/* Tags row */}
        <div
          className="flex flex-wrap gap-1 items-center mb-2 min-h-[20px]"
          data-testid="editor-tag-row"
        >
          {note.tags?.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              size="xs"
              muted
              className="bg-primary/10 text-primary/80 border-primary/20 dark:bg-primary/15 dark:text-primary/90"
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

        {/* Links row — visually separated from tags */}
        <div className="flex items-center gap-2 mb-5 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground/60 shrink-0 select-none">Links</span>
          <LinkedItems relations={linkRelations} />
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

    </div>
  );
}
