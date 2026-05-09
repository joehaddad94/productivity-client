import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  relativeDate,
  relativeNoteDate,
  formatFocusTime,
  formatDate,
  formatDisplayDate,
  formatTime,
  greeting,
  localDateStr,
} from "@/lib/date-utils";

// Pin "today" to 2026-05-09 for deterministic tests
const TODAY = new Date("2026-05-09T10:00:00");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── relativeDate ─────────────────────────────────────────────────────────────

describe("relativeDate", () => {
  it("returns Today for today's date", () => {
    expect(relativeDate("2026-05-09")).toBe("Today");
  });

  it("returns Tomorrow for next day", () => {
    expect(relativeDate("2026-05-10")).toBe("Tomorrow");
  });

  it("returns Yesterday for previous day", () => {
    expect(relativeDate("2026-05-08")).toBe("Yesterday");
  });

  it("returns X days ago for past dates", () => {
    expect(relativeDate("2026-05-05")).toBe("4 days ago");
    expect(relativeDate("2026-05-01")).toBe("8 days ago");
  });

  it("returns In X days for future dates", () => {
    expect(relativeDate("2026-05-14")).toBe("In 5 days");
    expect(relativeDate("2026-05-19")).toBe("In 10 days");
  });
});

// ─── relativeNoteDate ─────────────────────────────────────────────────────────

describe("relativeNoteDate", () => {
  it("returns Today for a timestamp from today", () => {
    expect(relativeNoteDate("2026-05-09T08:00:00")).toBe("Today");
  });

  it("returns Yesterday for 25 hours ago", () => {
    const d = new Date(TODAY.getTime() - 25 * 3600 * 1000).toISOString();
    expect(relativeNoteDate(d)).toBe("Yesterday");
  });

  it("returns Xd ago for 2-6 days ago", () => {
    const d3 = new Date(TODAY.getTime() - 3 * 86_400_000).toISOString();
    expect(relativeNoteDate(d3)).toBe("3d ago");
  });

  it("returns Mon DD for dates 7+ days ago", () => {
    const result = relativeNoteDate("2026-04-25T00:00:00");
    expect(result).toMatch(/Apr 25/);
  });
});

// ─── formatFocusTime ─────────────────────────────────────────────────────────

describe("formatFocusTime", () => {
  it("shows only minutes when under an hour", () => {
    expect(formatFocusTime(0)).toBe("0m");
    expect(formatFocusTime(45)).toBe("45m");
    expect(formatFocusTime(59)).toBe("59m");
  });

  it("shows only hours when no remaining minutes", () => {
    expect(formatFocusTime(60)).toBe("1h");
    expect(formatFocusTime(120)).toBe("2h");
    expect(formatFocusTime(180)).toBe("3h");
  });

  it("shows hours and minutes for mixed values", () => {
    expect(formatFocusTime(90)).toBe("1h 30m");
    expect(formatFocusTime(75)).toBe("1h 15m");
    expect(formatFocusTime(150)).toBe("2h 30m");
  });
});

// ─── formatDate ──────────────────────────────────────────────────────────────

describe("formatDate", () => {
  const currentYear = 2026;

  it("omits year when same as today's year", () => {
    expect(formatDate("2026-05-09", currentYear)).toBe("May 9");
    expect(formatDate("2026-01-01", currentYear)).toBe("Jan 1");
  });

  it("includes year when different from today's year", () => {
    expect(formatDate("2025-12-31", currentYear)).toContain("2025");
    expect(formatDate("2027-03-15", currentYear)).toContain("2027");
  });
});

// ─── formatDisplayDate ───────────────────────────────────────────────────────

describe("formatDisplayDate", () => {
  it("formats as Mon DD, YYYY", () => {
    expect(formatDisplayDate("2026-05-09")).toMatch(/May \d+, 2026/);
  });

  it("always includes the year", () => {
    expect(formatDisplayDate("2025-01-15")).toContain("2025");
  });
});

// ─── formatTime ──────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("converts midnight correctly", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("converts noon correctly", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("converts morning hours", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("converts afternoon hours", () => {
    expect(formatTime("14:45")).toBe("2:45 PM");
  });

  it("converts 23:59 correctly", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });
});

// ─── greeting ────────────────────────────────────────────────────────────────

describe("greeting", () => {
  it("returns Good morning before noon", () => {
    vi.setSystemTime(new Date("2026-05-09T08:00:00"));
    expect(greeting()).toBe("Good morning");
  });

  it("returns Good afternoon from noon to 6pm", () => {
    vi.setSystemTime(new Date("2026-05-09T14:00:00"));
    expect(greeting()).toBe("Good afternoon");
  });

  it("returns Good evening from 6pm onwards", () => {
    vi.setSystemTime(new Date("2026-05-09T20:00:00"));
    expect(greeting()).toBe("Good evening");
  });
});

// ─── localDateStr ────────────────────────────────────────────────────────────

describe("localDateStr", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(localDateStr(new Date("2026-05-09T00:00:00"))).toBe("2026-05-09");
  });

  it("pads month and day with leading zeros", () => {
    expect(localDateStr(new Date("2026-01-05T00:00:00"))).toBe("2026-01-05");
  });
});
