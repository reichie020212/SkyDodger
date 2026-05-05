import { describe, it, expect } from "vitest";
import { getPeriodStart } from "./scores";

const NOW = new Date("2026-05-15T14:00:00Z");

describe("getPeriodStart", () => {
  it("returns null for alltime", () => {
    expect(getPeriodStart("alltime", NOW)).toBeNull();
  });

  it("returns today's UTC midnight for today", () => {
    const start = getPeriodStart("today", NOW);
    expect(start).not.toBeNull();
    expect(start!.toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });

  it("returns 7 days ago (to the millisecond) for weekly", () => {
    const start = getPeriodStart("weekly", NOW);
    expect(start).not.toBeNull();
    expect(start!.toISOString()).toBe("2026-05-08T14:00:00.000Z");
  });

  it("returns 30 days ago for monthly", () => {
    const start = getPeriodStart("monthly", NOW);
    expect(start).not.toBeNull();
    expect(start!.toISOString()).toBe("2026-04-15T14:00:00.000Z");
  });

  it("today boundary uses UTC, not local time", () => {
    // 23:30 UTC on 2026-05-15 → start of 2026-05-15 UTC, not local.
    const lateInDay = new Date("2026-05-15T23:30:00Z");
    const start = getPeriodStart("today", lateInDay);
    expect(start!.toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });
});
