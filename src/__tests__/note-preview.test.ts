import { describe, it, expect } from "vitest";
import { getNotePreview } from "@/features/notes/lib/notePreview";

describe("getNotePreview", () => {
  it("returns empty values for missing content", () => {
    expect(getNotePreview(null)).toEqual({
      text: "",
      imageSrc: null,
      hasChecklist: false,
    });
    expect(getNotePreview(undefined).text).toBe("");
    expect(getNotePreview("").text).toBe("");
  });

  it("strips tags and keeps word boundaries between blocks", () => {
    // The previous implementation dropped tags without a separator, so
    // consecutive paragraphs ran together as "onetwo".
    expect(getNotePreview("<p>one</p><p>two</p>").text).toBe("one two");
    expect(getNotePreview("<ul><li>a</li><li>b</li></ul>").text).toBe("a b");
    expect(getNotePreview("first<br>second").text).toBe("first second");
  });

  it("decodes the entities TipTap emits", () => {
    expect(getNotePreview("<p>Tom &amp; Jerry</p>").text).toBe("Tom & Jerry");
    expect(getNotePreview("<p>a&nbsp;b</p>").text).toBe("a b");
    expect(getNotePreview("<p>&quot;quoted&quot;</p>").text).toBe('"quoted"');
    expect(getNotePreview("<p>&lt;tag&gt;</p>").text).toBe("<tag>");
  });

  it("collapses whitespace", () => {
    expect(getNotePreview("<p>  spaced   out  </p>").text).toBe("spaced out");
  });

  it("truncates with an ellipsis at the limit", () => {
    const long = `<p>${"a".repeat(300)}</p>`;
    const { text } = getNotePreview(long, 50);

    expect(text).toHaveLength(51); // 50 chars + ellipsis
    expect(text.endsWith("…")).toBe(true);
  });

  it("does not truncate content shorter than the limit", () => {
    expect(getNotePreview("<p>short</p>", 50).text).toBe("short");
  });

  it("extracts the first image src so image-only notes are not blank", () => {
    const html = '<img src="https://example.com/a.png"><img src="b.png">';
    const preview = getNotePreview(html);

    expect(preview.imageSrc).toBe("https://example.com/a.png");
    expect(preview.text).toBe("");
  });

  it("handles base64 data URIs, which notes allow", () => {
    const src = "data:image/png;base64,iVBORw0KGgo=";
    expect(getNotePreview(`<img src="${src}" />`).imageSrc).toBe(src);
  });

  it("detects TipTap checklists", () => {
    expect(
      getNotePreview('<ul class="task-list"><li>todo</li></ul>').hasChecklist,
    ).toBe(true);
    expect(
      getNotePreview('<li data-type="taskItem">todo</li>').hasChecklist,
    ).toBe(true);
    expect(getNotePreview("<p>plain</p>").hasChecklist).toBe(false);
  });
});
