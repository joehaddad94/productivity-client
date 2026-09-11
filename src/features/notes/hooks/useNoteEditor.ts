"use client";

import { useCallback, useEffect, useRef } from "react";
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

  /**
   * The edit waiting out the debounce window, kept alongside the timer so it
   * can be delivered rather than discarded when the window is cut short.
   * Carries its own noteId: a flush triggered by switching notes runs after
   * `noteId` has already changed, and the edit still belongs to the old note.
   */
  const pendingRef = useRef<{ noteId: string; html: string } | null>(null);

  const flushPending = useCallback(() => {
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) onHtmlDebouncedRef.current(pending.noteId, pending.html);
  }, []);

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
        const images = Array.from(files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (images.length === 0) return false;
        // Dropping several images used to insert only the first, silently.
        if (images.length > 1) {
          toast.info(`Inserting ${images.length} images`);
        }
        event.preventDefault();
        const coords = { left: event.clientX, top: event.clientY };
        const pos = view.posAtCoords(coords);
        // Sequential so the images land in the order they were dropped.
        void (async () => {
          let insertAt = pos?.pos;
          for (const image of images) {
            if (image.size > NOTE_EDITOR_MAX_IMAGE_BYTES) {
              toast.error(`"${image.name}" is too large (max 1.5 MB)`);
              continue;
            }
            const src = await readImageAsDataUrl(image);
            if (!src) {
              toast.error(`Could not read "${image.name}"`);
              continue;
            }
            const tr = view.state.tr;
            const node = view.state.schema.nodes.image.create({ src });
            if (insertAt !== undefined) {
              tr.insert(insertAt, node);
              insertAt += node.nodeSize;
            } else {
              tr.replaceSelectionWith(node);
            }
            view.dispatch(tr.scrollIntoView());
          }
        })();
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const scheduledForNoteId = noteIdRef.current;
      pendingRef.current = { noteId: scheduledForNoteId, html };
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
      contentDebounceRef.current = setTimeout(() => {
        contentDebounceRef.current = null;
        pendingRef.current = null;
        onHtmlDebouncedRef.current(scheduledForNoteId, html);
      }, CONTENT_DEBOUNCE_MS);
    },
  });

  // Switching notes must not drop an edit that has not finished debouncing.
  // Send it (against the note it was typed into) instead of cancelling it.
  useEffect(() => {
    return () => {
      flushPending();
    };
  }, [noteId, flushPending]);

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

  // Same on the way out: unmounting, hiding the tab, or closing it should
  // deliver the pending edit rather than discard it. `visibilitychange` is the
  // reliable one on mobile, where `beforeunload` often never fires.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushPending();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", flushPending);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", flushPending);
      flushPending();
    };
  }, [flushPending]);

  return { editor };
}
