/** Slug: lowercase letters, numbers, hyphens only; max 64 chars */
export const SLUG_REGEX = /^[a-z0-9-]*$/;
export const SLUG_MAX = 64;
export const NAME_MAX = 255;

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, SLUG_MAX);
}

export function validateSlug(slug: string): boolean {
  return slug.length <= SLUG_MAX && SLUG_REGEX.test(slug);
}
