/** Max size for pasted / dropped images in the note editor. */
export const NOTE_EDITOR_MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function readImageAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
