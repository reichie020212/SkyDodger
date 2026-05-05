import { NextRequest, NextResponse } from "next/server";
import { getUserStats } from "@/lib/scores";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const stats = await getUserStats(params.id);
  if (!stats.user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...stats,
    user: {
      id: stats.user.id,
      name: stats.user.name,
      image: stats.user.image,
      avatarHue: stats.user.avatarHue,
      createdAt: stats.user.createdAt,
    },
  });
}
