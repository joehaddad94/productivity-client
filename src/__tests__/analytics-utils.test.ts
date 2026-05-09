import { describe, it, expect } from "vitest";
import { computeScoreComponents, getHeatmapColor } from "@/lib/analytics-utils";

// ─── computeScoreComponents ──────────────────────────────────────────────────

describe("computeScoreComponents", () => {
  it("returns zero scores for no activity", () => {
    const { taskScore, focusScore, streakScore } = computeScoreComponents(0, 0, 0, 30);
    expect(taskScore).toBe(0);
    expect(focusScore).toBe(0);
    expect(streakScore).toBe(0);
  });

  it("caps each score at its maximum", () => {
    // Far exceed all benchmarks
    const { taskScore, focusScore, streakScore } = computeScoreComponents(9999, 9999, 9999, 30);
    expect(taskScore).toBe(50);
    expect(focusScore).toBe(30);
    expect(streakScore).toBe(20);
  });

  it("total never exceeds 100", () => {
    const { taskScore, focusScore, streakScore } = computeScoreComponents(9999, 9999, 9999, 30);
    expect(taskScore + focusScore + streakScore).toBe(100);
  });

  it("scales benchmarks with rangeDays", () => {
    // 7-day range: benchmark is ~12 tasks (50 * 7/30 ≈ 12)
    const { taskScore } = computeScoreComponents(11, 0, 0, 7);
    expect(taskScore).toBeGreaterThan(0);
    expect(taskScore).toBeLessThan(50);
  });

  it("streak score caps at 7-day streak", () => {
    const { streakScore: at7 }  = computeScoreComponents(0, 0, 7,  30);
    const { streakScore: at14 } = computeScoreComponents(0, 0, 14, 30);
    expect(at7).toBe(20);
    expect(at14).toBe(20); // capped
  });

  it("partial activity gives partial scores", () => {
    // 25 tasks out of 50 benchmark → 50% → 25pts
    const { taskScore } = computeScoreComponents(25, 0, 0, 30);
    expect(taskScore).toBeCloseTo(25, 1);
  });
});

// ─── getHeatmapColor ─────────────────────────────────────────────────────────

describe("getHeatmapColor", () => {
  it("returns gray for zero activity", () => {
    expect(getHeatmapColor(0)).toContain("gray");
  });

  it("returns light green for 1-2 tasks", () => {
    expect(getHeatmapColor(1)).toContain("green-200");
    expect(getHeatmapColor(2)).toContain("green-200");
  });

  it("returns medium green for 3-5 tasks", () => {
    expect(getHeatmapColor(3)).toContain("green-400");
    expect(getHeatmapColor(5)).toContain("green-400");
  });

  it("returns darker green for 6-8 tasks", () => {
    expect(getHeatmapColor(6)).toContain("green-600");
    expect(getHeatmapColor(8)).toContain("green-600");
  });

  it("returns darkest green for 9+ tasks", () => {
    expect(getHeatmapColor(9)).toContain("green-700");
    expect(getHeatmapColor(100)).toContain("green-700");
  });
});
