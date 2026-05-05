import { describe, it, expect } from "vitest";
import { checkPlausibility, MAX_PLAUSIBLE_SCORE } from "./anti-cheat";
import { MIN_MS_PER_PIPE } from "./engine-config";

describe("checkPlausibility", () => {
  it("accepts score of 0 with any non-negative duration (instant death)", () => {
    expect(checkPlausibility(0, "NORMAL", 0)).toEqual({ ok: true });
    expect(checkPlausibility(0, "INSANE", 5_000)).toEqual({ ok: true });
  });

  it("rejects negative score or duration", () => {
    expect(checkPlausibility(-1, "NORMAL", 1_000)).toEqual({
      ok: false,
      reason: "negative_score",
    });
    expect(checkPlausibility(5, "NORMAL", -10)).toEqual({
      ok: false,
      reason: "negative_score",
    });
  });

  it("rejects scores beyond the absurd-high cap", () => {
    expect(
      checkPlausibility(MAX_PLAUSIBLE_SCORE + 1, "NORMAL", 999_999_999),
    ).toEqual({ ok: false, reason: "score_too_high" });
  });

  it("rejects durations shorter than 90% of the theoretical minimum", () => {
    // EASY: ~2117 ms per pipe. 10 pipes ≈ 21,170 ms; 90% = 19,053 ms.
    const justUnder = Math.floor(MIN_MS_PER_PIPE.EASY * 10 * 0.9 - 100);
    expect(checkPlausibility(10, "EASY", justUnder)).toEqual({
      ok: false,
      reason: "duration_too_short",
    });
  });

  it("accepts durations at or above 90% of the theoretical minimum", () => {
    // 10% slack: same calculation but at the boundary.
    const justOver = Math.ceil(MIN_MS_PER_PIPE.HARD * 10 * 0.9 + 1);
    expect(checkPlausibility(10, "HARD", justOver)).toEqual({ ok: true });
  });

  it("uses the per-difficulty min — INSANE is faster than EASY", () => {
    // 5 pipes on INSANE: tighter min than EASY.
    const insaneMin = MIN_MS_PER_PIPE.INSANE * 5 * 0.9;
    const easyMin = MIN_MS_PER_PIPE.EASY * 5 * 0.9;
    // A duration that passes INSANE at 5 pipes should fail EASY at 5 pipes.
    const between = Math.floor((insaneMin + easyMin) / 2);
    expect(checkPlausibility(5, "INSANE", between)).toEqual({ ok: true });
    expect(checkPlausibility(5, "EASY", between)).toEqual({
      ok: false,
      reason: "duration_too_short",
    });
  });
});
