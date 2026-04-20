"use client";

import type { Editor } from "@tiptap/react";
import { Redo2, Undo2 } from "lucide-react";
import { ToolGroup, ToolbarToolButton } from "./toolbarPrimitives";

export function ToolbarHistory({ editor }: { editor: Editor }) {
  return (
    <ToolGroup>
      <ToolbarToolButton
        label="Undo (⌘Z)"
        icon={Undo2}
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarToolButton
        label="Redo (⌘⇧Z)"
        icon={Redo2}
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </ToolGroup>
  );
}
