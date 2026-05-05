import type { Difficulty } from "@prisma/client";
import { MIN_MS_PER_PIPE } from "./engine-config";

// Allow durations to fall up to 10% below the theoretical minimum to
// account for browser timing jitter without letting obviously-fake runs
// through.
const DURATION_SLACK = 0.9;

// Hard cap on a single run. Scores legitimately above this are still
// allowed but flagged for review at the call site if needed.
export const MAX_PLAUSIBLE_SCORE = 100_000;

export type PlausibilityResult =
  | { ok: true }
  | { ok: false; reason: "negative_score" | "duration_too_short" | "score_too_high" };

export function checkPlausibility(
  score: number,
  difficulty: Difficulty,
  durationMs: number,
): PlausibilityResult {
  if (score < 0 || durationMs < 0) {
    return { ok: false, reason: "negative_score" };
  }
  if (score > MAX_PLAUSIBLE_SCORE) {
    return { ok: false, reason: "score_too_high" };
  }
  // Score 0 is a valid run (instant death) — any non-negative duration is fine.
  if (score === 0) return { ok: true };

  const expectedMin = score * MIN_MS_PER_PIPE[difficulty] * DURATION_SLACK;
  if (durationMs < expectedMin) {
    return { ok: false, reason: "duration_too_short" };
  }
  return { ok: true };
}
