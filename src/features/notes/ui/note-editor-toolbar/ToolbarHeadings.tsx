"use client";

import type { Editor } from "@tiptap/react";
import { Heading1, Heading2 } from "lucide-react";
import { ToolGroup, ToolbarToolButton } from "./toolbarPrimitives";

export function ToolbarHeadings({ editor }: { editor: Editor }) {
  return (
    <ToolGroup>
      <ToolbarToolButton
        label="Heading 1"
        icon={Heading1}
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarToolButton
        label="Heading 2"
        icon={Heading2}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
    </ToolGroup>
  );
}
