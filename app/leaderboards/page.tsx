import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeaderboard, type Period } from "@/lib/scores";
import { DIFFICULTY_API, apiToEnum } from "@/lib/engine-config";
import { Tabs } from "@/components/Tabs";
import { AdSlot } from "@/components/AdSlot";
import { Podium } from "@/components/Podium";
import { LeaderboardTableWithAds } from "@/components/LeaderboardTableWithAds";

export const metadata = {
  title: "Leaderboards · Sky Dodger",
};

const PeriodSchema = z.enum(["today", "weekly", "monthly", "alltime"]);
const DiffSchema = z.enum(["all", ...DIFFICULTY_API]);

const PERIOD_TABS = [
  { value: "today", label: "Today" },
  { value: "weekly", label: "Week" },
  { value: "monthly", label: "Month" },
  { value: "alltime", label: "All-time" },
];

const DIFF_TABS = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "insane", label: "Insane" },
];

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: { period?: string; difficulty?: string };
}) {
  const periodParse = PeriodSchema.safeParse(searchParams.period);
  const period: Period = periodParse.success ? periodParse.data : "alltime";
  const diffParse = DiffSchema.safeParse(searchParams.difficulty);
  const diffParam = diffParse.success ? diffParse.data : "all";
  const difficulty = diffParam === "all" ? "all" : apiToEnum(diffParam);

  const [session, rows] = await Promise.all([
    auth(),
    getLeaderboard({ period, difficulty, limit: 50 }),
  ]);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 18 }}>
        <div>
          <div className="h1">Global leaderboards</div>
          <div className="muted">
            Compete with players worldwide. Updated in real-time.
          </div>
        </div>
        <Tabs
          options={PERIOD_TABS}
          paramName="period"
          current={period}
          defaultValue="alltime"
        />
      </div>

      <div style={{ marginBottom: 22 }}>
        <AdSlot kind="leaderboard" />
      </div>

      <Podium rows={rows} />

      <div className="card">
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontSize: 13, fontWeight: 600, alignSelf: "center", marginRight: 8 }}
          >
            Filter:
          </span>
          <Tabs
            options={DIFF_TABS}
            paramName="difficulty"
            current={diffParam}
            defaultValue="all"
          />
        </div>
        <LeaderboardTableWithAds
          rows={rows}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  );
}
