import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserStats } from "@/lib/scores";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getUserStats(session.user.id);
  return NextResponse.json(stats);
}
