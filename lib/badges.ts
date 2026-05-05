// Badge award engine. Computes which badges a user qualifies for based
// on their score history and awards any not yet earned. Idempotent — a
// re-run after no progress is a no-op (returns []).

import type { Difficulty, Badge } from "@prisma/client";
import { prisma } from "./prisma";

type BadgeContext = {
  totalGames: number;
  bestScore: number;
  bestByDifficulty: Record<Difficulty, number>;
  consecutiveDays: number;
  globalRank: number; // 0 if user has no scores
  hasNightOwlScore: boolean;
};

type BadgeRule = (ctx: BadgeContext) => boolean;

const BADGE_RULES: Record<string, BadgeRule> = {
  first_flight:  (ctx) => ctx.bestScore >= 1,
  ten_pipes:     (ctx) => ctx.bestScore >= 10,
  fifty_pipes:   (ctx) => ctx.bestScore >= 50,
  hundred_pipes: (ctx) => ctx.bestScore >= 100,
  hard_mode:     (ctx) => ctx.bestByDifficulty.HARD >= 25,
  insane_mode:   (ctx) => ctx.bestByDifficulty.INSANE >= 15,
  streak_7:      (ctx) => ctx.consecutiveDays >= 7,
  top_100:       (ctx) => ctx.globalRank > 0 && ctx.globalRank <= 100,
  top_10:        (ctx) => ctx.globalRank > 0 && ctx.globalRank <= 10,
  night_owl:     (ctx) => ctx.hasNightOwlScore,
};

export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const ctx = await buildContext(userId);

  const allBadges = await prisma.badge.findMany();
  const alreadyEarned = new Set(
    (
      await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      })
    ).map((ub) => ub.badgeId),
  );

  const toAward: Badge[] = [];
  for (const badge of allBadges) {
    if (alreadyEarned.has(badge.id)) continue;
    const rule = BADGE_RULES[badge.id];
    if (!rule) continue; // unknown badge — skip rather than crash
    if (rule(ctx)) toAward.push(badge);
  }

  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  return toAward;
}

async function buildContext(userId: string): Promise<BadgeContext> {
  const [agg, byDifficulty, scoreDays, nightOwlCount] = await Promise.all([
    prisma.score.aggregate({
      where: { userId },
      _max: { score: true },
      _count: { _all: true },
    }),
    prisma.score.groupBy({
      by: ["difficulty"],
      where: { userId },
      _max: { score: true },
    }),
    prisma.score.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Score"
      WHERE "userId" = ${userId}
        AND EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC') < 5
    `,
  ]);

  const bestByDifficulty: Record<Difficulty, number> = {
    EASY: 0,
    NORMAL: 0,
    HARD: 0,
    INSANE: 0,
  };
  for (const row of byDifficulty) {
    bestByDifficulty[row.difficulty] = row._max.score ?? 0;
  }

  const consecutiveDays = computeConsecutiveDays(
    scoreDays.map((s) => s.createdAt),
  );

  const bestScore = agg._max.score ?? 0;
  const globalRank = bestScore > 0 ? await computeRank(bestScore) : 0;

  const hasNightOwlScore = (nightOwlCount[0]?.count ?? BigInt(0)) > BigInt(0);

  return {
    totalGames: agg._count._all,
    bestScore,
    bestByDifficulty,
    consecutiveDays,
    globalRank,
    hasNightOwlScore,
  };
}

async function computeRank(myBest: number): Promise<number> {
  const usersAhead = await prisma.user.count({
    where: { scores: { some: { score: { gt: myBest } } } },
  });
  return usersAhead + 1;
}

// Counts the longest streak of consecutive UTC days ending today (or
// yesterday). Each input date is collapsed to its UTC date string and
// deduped, then the streak walks backward from the most recent.
export function computeConsecutiveDays(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  let cursor: Date;
  if (days.has(today.toISOString().slice(0, 10))) {
    cursor = today;
  } else if (days.has(yesterday.toISOString().slice(0, 10))) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}
