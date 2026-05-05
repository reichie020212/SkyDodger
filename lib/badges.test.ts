import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computeConsecutiveDays } from "./badges";

const FROZEN_NOW = new Date("2026-05-15T08:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function utcDate(s: string): Date {
  return new Date(s + "T12:00:00Z");
}

describe("computeConsecutiveDays", () => {
  it("returns 0 for an empty list", () => {
    expect(computeConsecutiveDays([])).toBe(0);
  });

  it("returns 0 when the most recent score is more than a day old", () => {
    const dates = [utcDate("2026-05-13"), utcDate("2026-05-12")];
    expect(computeConsecutiveDays(dates)).toBe(0);
  });

  it("counts a single-day streak ending today", () => {
    expect(computeConsecutiveDays([utcDate("2026-05-15")])).toBe(1);
  });

  it("counts a streak ending yesterday (player hasn't played today yet)", () => {
    expect(computeConsecutiveDays([utcDate("2026-05-14")])).toBe(1);
  });

  it("counts seven consecutive UTC days", () => {
    const dates = [
      utcDate("2026-05-15"),
      utcDate("2026-05-14"),
      utcDate("2026-05-13"),
      utcDate("2026-05-12"),
      utcDate("2026-05-11"),
      utcDate("2026-05-10"),
      utcDate("2026-05-09"),
    ];
    expect(computeConsecutiveDays(dates)).toBe(7);
  });

  it("breaks the streak on a missed day", () => {
    const dates = [
      utcDate("2026-05-15"),
      utcDate("2026-05-14"),
      // skip 2026-05-13
      utcDate("2026-05-12"),
      utcDate("2026-05-11"),
    ];
    expect(computeConsecutiveDays(dates)).toBe(2);
  });

  it("dedupes multiple scores on the same day", () => {
    const dates = [
      new Date("2026-05-15T08:00:00Z"),
      new Date("2026-05-15T20:00:00Z"),
      new Date("2026-05-14T03:00:00Z"),
    ];
    expect(computeConsecutiveDays(dates)).toBe(2);
  });

  it("ignores scores after the most recent contiguous run", () => {
    // A 2-day streak today/yesterday, then a stray score 5 days ago.
    const dates = [
      utcDate("2026-05-15"),
      utcDate("2026-05-14"),
      utcDate("2026-05-10"),
    ];
    expect(computeConsecutiveDays(dates)).toBe(2);
  });
});
