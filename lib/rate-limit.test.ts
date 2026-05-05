import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkScoreRate,
  SCORE_COOLDOWN_MS,
  _resetRateLimitForTests,
} from "./rate-limit";

beforeEach(() => {
  _resetRateLimitForTests();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-15T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkScoreRate", () => {
  it("allows the first submission", () => {
    expect(checkScoreRate("user-1")).toEqual({ ok: true });
  });

  it("rejects a second submission within the cooldown", () => {
    checkScoreRate("user-1");
    vi.advanceTimersByTime(1_000);
    const res = checkScoreRate("user-1");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.retryAfterMs).toBeGreaterThan(0);
      expect(res.retryAfterMs).toBeLessThanOrEqual(SCORE_COOLDOWN_MS);
    }
  });

  it("allows a second submission after the cooldown elapses", () => {
    checkScoreRate("user-1");
    vi.advanceTimersByTime(SCORE_COOLDOWN_MS + 1);
    expect(checkScoreRate("user-1")).toEqual({ ok: true });
  });

  it("tracks each user independently", () => {
    expect(checkScoreRate("a")).toEqual({ ok: true });
    expect(checkScoreRate("b")).toEqual({ ok: true });
    vi.advanceTimersByTime(500);
    expect(checkScoreRate("a").ok).toBe(false);
    expect(checkScoreRate("b").ok).toBe(false);
  });
});
