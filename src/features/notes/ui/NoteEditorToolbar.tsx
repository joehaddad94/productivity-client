"use client";

import type { Editor } from "@tiptap/react";
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
