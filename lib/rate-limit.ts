// Per-user submission rate limiter. In-memory leaky bucket — fine for an
// MVP single-region deployment; on Vercel's multi-region cold-starts a
// determined cheater could bypass it, but the duration-based plausibility
// check in lib/anti-cheat.ts is the real defense (see Blueprint
// decision 3). Revisit Vercel KV if abuse appears.

const lastSubmission = new Map<string, number>();
export const SCORE_COOLDOWN_MS = 3_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

export function checkScoreRate(
  userId: string,
  cooldownMs: number = SCORE_COOLDOWN_MS,
): RateLimitResult {
  const now = Date.now();
  const last = lastSubmission.get(userId) ?? 0;
  const elapsed = now - last;
  if (elapsed < cooldownMs) {
    return { ok: false, retryAfterMs: cooldownMs - elapsed };
  }
  lastSubmission.set(userId, now);
  return { ok: true };
}

// Test hook — do not use in production paths.
export function _resetRateLimitForTests() {
  lastSubmission.clear();
}
