import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLeaderboard, type Period } from "@/lib/scores";
import { DIFFICULTY_API, apiToEnum } from "@/lib/engine-config";

const PeriodSchema = z.enum(["today", "weekly", "monthly", "alltime"]);
const DifficultyFilterSchema = z.enum(["all", ...DIFFICULTY_API]);
const LimitSchema = z.coerce.number().int().min(1).max(100).default(50);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const periodParse = PeriodSchema.safeParse(url.searchParams.get("period") ?? "alltime");
  const difficultyParse = DifficultyFilterSchema.safeParse(
    url.searchParams.get("difficulty") ?? "all",
  );
  const limitParse = LimitSchema.safeParse(url.searchParams.get("limit") ?? "50");

  if (!periodParse.success || !difficultyParse.success || !limitParse.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 422 },
    );
  }

  const period: Period = periodParse.data;
  const difficultyParam = difficultyParse.data;
  const difficulty = difficultyParam === "all" ? "all" : apiToEnum(difficultyParam);

  const rows = await getLeaderboard({
    period,
    difficulty,
    limit: limitParse.data,
  });

  return NextResponse.json({ rows });
}
