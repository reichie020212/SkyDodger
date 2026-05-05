import type { Difficulty, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { enumToApi } from "./engine-config";

export type Period = "today" | "weekly" | "monthly" | "alltime";

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns the inclusive lower bound for `createdAt`, or null for alltime.
export function getPeriodStart(period: Period, now: Date = new Date()): Date | null {
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setUTCHours(0, 0, 0, 0);
      return start;
    }
    case "weekly":
      return new Date(now.getTime() - 7 * DAY_MS);
    case "monthly":
      return new Date(now.getTime() - 30 * DAY_MS);
    case "alltime":
      return null;
  }
}

export type LeaderboardRow = {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  avatarHue: number;
  score: number;
  difficulty: ReturnType<typeof enumToApi>;
  durationMs: number;
  createdAt: Date;
};

export async function getLeaderboard(opts: {
  period: Period;
  difficulty: Difficulty | "all";
  limit: number;
}): Promise<LeaderboardRow[]> {
  const since = getPeriodStart(opts.period);
  const where: Prisma.ScoreWhereInput = {};
  if (since) where.createdAt = { gte: since };
  if (opts.difficulty !== "all") where.difficulty = opts.difficulty;

  const scores = await prisma.score.findMany({
    where,
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: opts.limit,
    include: {
      user: {
        select: { id: true, name: true, image: true, avatarHue: true },
      },
    },
  });

  return scores.map((s, i) => ({
    rank: i + 1,
    userId: s.user.id,
    name: s.user.name,
    image: s.user.image,
    avatarHue: s.user.avatarHue,
    score: s.score,
    difficulty: enumToApi(s.difficulty),
    durationMs: s.durationMs,
    createdAt: s.createdAt,
  }));
}

export type UserStats = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    avatarHue: number;
    createdAt: Date;
  } | null;
  bestScore: number;
  totalGames: number;
  totalPipes: number;
  avgScore: number;
  globalRank: number; // 1-indexed; 0 if user has no scores yet
  history: Array<{
    id: string;
    score: number;
    difficulty: ReturnType<typeof enumToApi>;
    durationMs: number;
    createdAt: Date;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    glyph: string;
    threshold: number;
    category: string;
    earnedAt: Date;
  }>;
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const [user, agg, history, userBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarHue: true,
        createdAt: true,
      },
    }),
    prisma.score.aggregate({
      where: { userId },
      _max: { score: true },
      _sum: { score: true },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.score.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        score: true,
        difficulty: true,
        durationMs: true,
        createdAt: true,
      },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: "asc" },
      include: { badge: true },
    }),
  ]);

  const bestScore = agg._max.score ?? 0;
  const globalRank = bestScore > 0 ? await computeGlobalRank(bestScore) : 0;

  return {
    user,
    bestScore,
    totalGames: agg._count._all,
    totalPipes: agg._sum.score ?? 0,
    avgScore: agg._avg.score ?? 0,
    globalRank,
    history: history.map((h) => ({
      ...h,
      difficulty: enumToApi(h.difficulty),
    })),
    badges: userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      glyph: ub.badge.glyph,
      threshold: ub.badge.threshold,
      category: ub.badge.category,
      earnedAt: ub.earnedAt,
    })),
  };
}

// 1-indexed rank: count users whose best-score-anywhere exceeds `myBest`,
// plus one. Ties resolve to the earlier `createdAt` per the leaderboard
// query, but rank is per-user (not per-row).
export async function computeGlobalRank(myBest: number): Promise<number> {
  const usersAhead = await prisma.user.count({
    where: {
      scores: { some: { score: { gt: myBest } } },
    },
  });
  return usersAhead + 1;
}
