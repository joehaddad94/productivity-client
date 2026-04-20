import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export function buildNoteEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
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
  ];
}
