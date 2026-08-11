/**
 * Derives card display data from a note's stored HTML.
 *
 * The old inline `content.replace(/<[^>]+>/g, "")` had two problems the gallery
 * makes obvious: block tags were stripped without leaving a space (so
 * "<p>one</p><p>two</p>" previewed as "onetwo"), and an image-only note
 * produced an empty string, rendering as a blank card. This keeps word
 * boundaries, decodes the entities TipTap emits, and surfaces the first image
 * so those notes can show a thumbnail instead.
 */

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;
const BLOCK_END_RE = /<\/(?:p|div|li|h[1-6]|blockquote|pre|tr)>/gi;
const BREAK_RE = /<(?:br|hr)\s*\/?>/gi;
const TAG_RE = /<[^>]+>/g;
const CHECKLIST_RE = /data-type=["']taskItem["']|class=["'][^"']*task-list/i;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

export interface NotePreview {
  /** Plain-text excerpt, truncated with an ellipsis. */
  text: string;
  /** `src` of the first image in the note, if any. */
  imageSrc: string | null;
  /** Whether the note contains a TipTap checklist. */
  hasChecklist: boolean;
}

export function getNotePreview(
  html: string | null | undefined,
  maxLength = 220,
): NotePreview {
  if (!html) return { text: "", imageSrc: null, hasChecklist: false };

  const text = html
    .replace(BLOCK_END_RE, " ")
    .replace(BREAK_RE, " ")
    .replace(TAG_RE, "")
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, " ")
    .trim();

  return {
    text:
      text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text,
    imageSrc: html.match(IMG_SRC_RE)?.[1] ?? null,
    hasChecklist: CHECKLIST_RE.test(html),
  };
}
