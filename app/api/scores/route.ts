import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPlausibility } from "@/lib/anti-cheat";
import { checkScoreRate } from "@/lib/rate-limit";
import { checkAndAwardBadges } from "@/lib/badges";
import {
  DIFFICULTY_API,
  apiToEnum,
  enumToApi,
} from "@/lib/engine-config";

const SubmitScoreSchema = z.object({
  score: z.number().int().min(0),
  difficulty: z.enum(DIFFICULTY_API),
  durationMs: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rate = checkScoreRate(userId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: rate.retryAfterMs },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rate.retryAfterMs / 1000)) },
      },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmitScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { score, difficulty, durationMs } = parsed.data;
  const difficultyEnum = apiToEnum(difficulty);

  const plausibility = checkPlausibility(score, difficultyEnum, durationMs);
  if (!plausibility.ok) {
    return NextResponse.json(
      { error: "Score failed plausibility check", reason: plausibility.reason },
      { status: 422 },
    );
  }

  const created = await prisma.score.create({
    data: {
      userId,
      score,
      difficulty: difficultyEnum,
      durationMs,
    },
  });

  const newBadges = await checkAndAwardBadges(userId);

  return NextResponse.json(
    {
      score: {
        id: created.id,
        score: created.score,
        difficulty: enumToApi(created.difficulty),
        durationMs: created.durationMs,
        createdAt: created.createdAt,
      },
      newBadges: newBadges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        glyph: b.glyph,
      })),
    },
    { status: 201 },
  );
}
