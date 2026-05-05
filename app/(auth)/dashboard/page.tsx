import Link from "next/link";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats, getLeaderboard } from "@/lib/scores";
import { DIFFICULTY_API } from "@/lib/engine-config";
import { Tabs } from "@/components/Tabs";
import { AdSlot } from "@/components/AdSlot";
import { Stat } from "@/components/Stat";
import { Tag } from "@/components/Tag";
import { ScoreChart } from "@/components/ScoreChart";
import { DiffDistribution } from "@/components/DiffDistribution";
import { BadgesGrid } from "@/components/BadgesGrid";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { fmtTime, fmtAgo, diffTagKind } from "@/lib/format";
import type { TagKind } from "@/components/Tag";

export const metadata = {
  title: "Dashboard · Sky Dodger",
};

const DiffFilterSchema = z.enum(["all", ...DIFFICULTY_API]);
const DIFF_TABS = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "normal", label: "Normal" },
  { value: "hard", label: "Hard" },
  { value: "insane", label: "Insane" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { diff?: string };
}) {
  const session = await auth();
  // (auth) layout already redirected — this is just a type narrowing safety net.
  if (!session?.user?.id) return null;

  const diffParam = DiffFilterSchema.safeParse(searchParams.diff).success
    ? (searchParams.diff as (typeof DIFF_TABS)[number]["value"])
    : "all";

  const [stats, allBadges, weeklyTop] = await Promise.all([
    getUserStats(session.user.id),
    prisma.badge.findMany({ orderBy: { threshold: "asc" } }),
    getLeaderboard({ period: "weekly", difficulty: "all", limit: 6 }),
  ]);

  const filteredHistory =
    diffParam === "all"
      ? stats.history
      : stats.history.filter((h) => h.difficulty === diffParam);

  const totalTimeMs = stats.history.reduce((s, h) => s + h.durationMs, 0);
  const earnedIds = new Set(stats.badges.map((b) => b.id));
  const userName = session.user.name ?? session.user.email ?? "you";
  const firstName = userName.split(" ")[0];
  const memberSince = stats.user?.createdAt
    ? new Date(stats.user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "recently";

  return (
    <div className="grid-2">
      <div className="col">
        <div>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div>
              <div className="h1">Welcome back, {firstName}</div>
              <div className="muted">Member since {memberSince}</div>
            </div>
            <Link href="/play" className="btn btn-coral btn-lg">
              Play now →
            </Link>
          </div>

          <div className="stat-grid">
            <Stat label="Best score" value={stats.bestScore} />
            <Stat
              label="Games played"
              value={stats.totalGames}
              trend={`${Math.round(totalTimeMs / 60000)} min total`}
            />
            <Stat
              label="Average"
              value={Math.round(stats.avgScore)}
              trend="last 30 runs"
            />
            <Stat
              label="Global rank"
              value={stats.globalRank > 0 ? `#${stats.globalRank}` : "—"}
            />
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 className="h2" style={{ margin: 0 }}>
              Score progression
            </h3>
            <Tabs
              options={DIFF_TABS}
              paramName="diff"
              current={diffParam}
              defaultValue="all"
            />
          </div>
          {filteredHistory.length > 0 ? (
            <ScoreChart data={filteredHistory} />
          ) : (
            <div
              className="muted"
              style={{ padding: 24, textAlign: "center", fontSize: 13 }}
            >
              No runs in this difficulty yet. Play a few rounds to populate
              the chart.
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <div
              className="h3"
              style={{
                marginBottom: 8,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-3)",
              }}
            >
              Difficulty mix
            </div>
            <DiffDistribution history={stats.history} />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <AdSlot kind="native" label="Google AdSense · in-feed native unit" />
        </div>

        <div className="card card-pad">
          <h3 className="h2">
            Badges{" "}
            <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>
              · {earnedIds.size}/{allBadges.length}
            </span>
          </h3>
          <BadgesGrid all={allBadges} earnedIds={earnedIds} />
        </div>

        <div className="card card-pad">
          <h3 className="h2">Recent runs</h3>
          {stats.history.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>
              No runs yet. <Link href="/play">Start playing →</Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Mode</th>
                  <th style={{ textAlign: "right" }}>Score</th>
                  <th style={{ textAlign: "right" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 8).map((h) => (
                  <tr key={h.id}>
                    <td className="muted">{fmtAgo(h.createdAt)}</td>
                    <td>
                      <Tag kind={diffTagKind(h.difficulty) as TagKind}>
                        {h.difficulty}
                      </Tag>
                    </td>
                    <td
                      className="mono"
                      style={{ textAlign: "right", fontWeight: 700 }}
                    >
                      {h.score}
                    </td>
                    <td
                      className="mono muted"
                      style={{ textAlign: "right" }}
                    >
                      {fmtTime(h.durationMs / 1000)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="col">
        <AdSlot kind="rectangle" label="Google AdSense · 300×250 (above-fold)" />

        <div className="card card-pad">
          <h3 className="h3">This week&apos;s top</h3>
          <LeaderboardTable
            rows={weeklyTop}
            showDifficulty={false}
            currentUserId={session.user.id}
          />
          <Link
            href="/leaderboards?period=weekly"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
          >
            See full leaderboards →
          </Link>
        </div>

        <AdSlot
          kind="skyscraper"
          label="Google AdSense · 160×600 (sidebar sticky)"
        />
      </div>
    </div>
  );
}
