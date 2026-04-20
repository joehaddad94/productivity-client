"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic } from "lucide-react";
import { ToolGroup, ToolbarToolButton } from "./toolbarPrimitives";

export function ToolbarInlineMarks({ editor }: { editor: Editor }) {
  return (
    <ToolGroup>
      <ToolbarToolButton
        label="Bold (⌘B)"
        icon={Bold}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarToolButton
        label="Italic (⌘I)"
        icon={Italic}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
    </ToolGroup>
  );
}
