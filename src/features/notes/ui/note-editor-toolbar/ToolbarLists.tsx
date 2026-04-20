"use client";

import type { Editor } from "@tiptap/react";
import { List, ListOrdered } from "lucide-react";
import { ToolGroup, ToolbarToolButton } from "./toolbarPrimitives";

export function ToolbarLists({ editor }: { editor: Editor }) {
  return (
    <ToolGroup>
      <ToolbarToolButton
        label="Bullet list"
        icon={List}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarToolButton
        label="Numbered list"
        icon={ListOrdered}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </ToolGroup>
  );
}
