/**
 * Bug report screenshots are stored in `contextJson.attachments` as base64
 * (see ReportBugSheet submit payload).
 */

export type BugReportImageAttachment = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
};

export function parseBugReportImageAttachments(
  contextJson: Record<string, unknown> | null | undefined,
): BugReportImageAttachment[] {
  if (!contextJson || typeof contextJson !== "object") return [];
  const raw = contextJson.attachments;
  if (!Array.isArray(raw)) return [];
  const out: BugReportImageAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const fileName = typeof o.fileName === "string" ? o.fileName : "image";
    const mimeType =
      typeof o.mimeType === "string" && o.mimeType.startsWith("image/")
        ? o.mimeType
        : "image/jpeg";
    const dataBase64 = typeof o.dataBase64 === "string" ? o.dataBase64 : "";
    if (dataBase64.length > 0) out.push({ fileName, mimeType, dataBase64 });
  }
  return out;
}

export function attachmentDataUrl(a: BugReportImageAttachment): string {
  return `data:${a.mimeType};base64,${a.dataBase64}`;
}

/** Reads an image file to the shape stored in `contextJson.attachments`. */
export function readImageFileAsAttachmentPart(file: File): Promise<BugReportImageAttachment> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const r = fr.result as string;
      const comma = r.indexOf(",");
      const dataBase64 = comma >= 0 ? r.slice(comma + 1) : r;
      resolve({
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        dataBase64,
      });
    };
    fr.onerror = () => reject(fr.error ?? new Error("Could not read file"));
    fr.readAsDataURL(file);
  });
}
