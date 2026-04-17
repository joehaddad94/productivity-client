/**
 * Deterministic colour assignment for tags. Given the same label, the chip
 * will always land on the same slot in the palette, so colours stay stable
 * across reloads, filters, and devices.
 */

export const TAG_PALETTE_SIZE = 12;

export function tagPaletteIndex(tag: string): number {
  const normalized = tag.trim().toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % TAG_PALETTE_SIZE;
}

export interface TagColorStyle {
  /** Background colour at a low opacity for the chip surface. */
  backgroundColor: string;
  /** Border colour slightly stronger than the background. */
  borderColor: string;
  /** Text colour matching the palette entry. */
  color: string;
}

/**
 * Returns inline style values that reference our global CSS colour variables,
 * so the chip's appearance follows light/dark mode automatically.
 */
export function tagColorStyle(tag: string): TagColorStyle {
  const idx = tagPaletteIndex(tag);
  const varName = paletteVar(idx);
  return {
    backgroundColor: `color-mix(in oklch, ${varName} 18%, transparent)`,
    borderColor: `color-mix(in oklch, ${varName} 45%, transparent)`,
    color: `color-mix(in oklch, ${varName} 80%, var(--foreground))`,
  };
}

function paletteVar(idx: number): string {
  switch (idx) {
    case 0:
      return "var(--chart-1)";
    case 1:
      return "var(--chart-2)";
    case 2:
      return "var(--chart-3)";
    case 3:
      return "var(--chart-4)";
    case 4:
      return "var(--chart-5)";
    case 5:
      return "var(--loader-1)";
    case 6:
      return "var(--loader-2)";
    case 7:
      return "var(--loader-3)";
    case 8:
      return "var(--loader-4)";
    case 9:
      return "var(--loader-5)";
    case 10:
      return "var(--loader-6)";
    default:
      return "var(--primary)";
  }
}
