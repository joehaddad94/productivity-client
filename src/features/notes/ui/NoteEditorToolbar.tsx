"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ToolbarDivider } from "./note-editor-toolbar/toolbarPrimitives";
import { ToolbarHeadings } from "./note-editor-toolbar/ToolbarHeadings";
import { ToolbarHistory } from "./note-editor-toolbar/ToolbarHistory";
import { ToolbarInlineMarks } from "./note-editor-toolbar/ToolbarInlineMarks";
import { ToolbarLinkPopover } from "./note-editor-toolbar/ToolbarLinkPopover";
import { ToolbarLists } from "./note-editor-toolbar/ToolbarLists";
import { ToolbarMorePopover } from "./note-editor-toolbar/ToolbarMorePopover";
import { ToolbarSaveStatus } from "./note-editor-toolbar/ToolbarSaveStatus";

interface Props {
  editor: Editor | null;
  isSaving?: boolean;
}

export function NoteEditorToolbar({ editor, isSaving }: Props) {
  // TipTap v3's useEditor deliberately does not re-render on every
  // transaction, so the isActive() calls in the child buttons were evaluated
  // once and never again — no button ever showed its active state as the
  // caret moved. Subscribing here re-renders the bar (and its children) when
  // any of the formatting the bar reflects actually changes.
  useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? [
            ed.isActive("bold"),
            ed.isActive("italic"),
            ed.isActive("strike"),
            ed.isActive("code"),
            ed.isActive("codeBlock"),
            ed.isActive("blockquote"),
            ed.isActive("link"),
            ed.isActive("bulletList"),
            ed.isActive("orderedList"),
            ed.isActive("taskList"),
            ed.isActive("heading", { level: 1 }),
            ed.isActive("heading", { level: 2 }),
            ed.isActive("heading", { level: 3 }),
            ed.can().undo(),
            ed.can().redo(),
          ].join("|")
        : "",
  });

  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      data-testid="editor-toolbar"
      className="flex flex-wrap items-center gap-0.5 px-3 py-1 border-b border-border/40 bg-background/70 backdrop-blur-sm sticky top-0 z-10"
    >
      <ToolbarHistory editor={editor} />
      <ToolbarDivider />
      <ToolbarHeadings editor={editor} />
      <ToolbarDivider />
      <ToolbarInlineMarks editor={editor} />
      <ToolbarDivider />
      <ToolbarLists editor={editor} />
      <ToolbarDivider />
      <ToolbarLinkPopover editor={editor} />
      <ToolbarMorePopover editor={editor} />
      <div className="flex-1" />
      <ToolbarSaveStatus isSaving={isSaving} />
    </div>
  );
}
