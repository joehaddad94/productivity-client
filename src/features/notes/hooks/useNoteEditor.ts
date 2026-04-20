"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@tiptap/react";
import { toast } from "sonner";
import { buildNoteEditorExtensions } from "../lib/noteEditorExtensions";
import { NOTE_EDITOR_MAX_IMAGE_BYTES, readImageAsDataUrl } from "../lib/noteEditorImage";

const CONTENT_DEBOUNCE_MS = 1000;

type UseNoteEditorOptions = {
  noteId: string;
  /** HTML from the server / parent; applied when `noteId` changes. */
  contentHtml: string;
  /** Called after typing stops; `noteId` is the note that was active when the edit was scheduled. */
  onHtmlDebounced: (noteId: string, html: string) => void;
};

export function useNoteEditor({ noteId, contentHtml, onHtmlDebounced }: UseNoteEditorOptions) {
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef(noteId);
  noteIdRef.current = noteId;
  const onHtmlDebouncedRef = useRef(onHtmlDebounced);
  onHtmlDebouncedRef.current = onHtmlDebounced;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildNoteEditorExtensions(),
    content: contentHtml,
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            if (file.size > NOTE_EDITOR_MAX_IMAGE_BYTES) {
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
        if (file.size > NOTE_EDITOR_MAX_IMAGE_BYTES) {
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
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const scheduledForNoteId = noteIdRef.current;
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = setTimeout(() => {
        onHtmlDebouncedRef.current(scheduledForNoteId, html);
      }, CONTENT_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = null;
    }
  }, [noteId]);

  useEffect(() => {
    if (!editor || contentHtml === undefined) return;
    const current = editor.getHTML();
    if (current !== (contentHtml ?? "")) {
      editor.commands.setContent(contentHtml ?? "");
    }
    // Re-sync when switching notes or when the editor instance first mounts; omit `contentHtml`
    // from deps so remote updates to the same note do not overwrite local edits (prior behavior).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor]);

  useEffect(() => {
    return () => {
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
    };
  }, []);

  return { editor };
}
