import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/scores";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { AdSlot } from "@/components/AdSlot";
import { ScoreChart } from "@/components/ScoreChart";
import { BadgesGrid } from "@/components/BadgesGrid";
import { AvatarHueEditor } from "@/components/AvatarHueEditor";
import { fmtTime, fmtAgo, diffTagKind } from "@/lib/format";
import type { TagKind } from "@/components/Tag";

export const metadata = {
  title: "Profile · Sky Dodger",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [stats, allBadges] = await Promise.all([
    getUserStats(session.user.id),
    prisma.badge.findMany({ orderBy: { threshold: "asc" } }),
  ]);
  if (!stats.user) return null;

  const earnedIds = new Set(stats.badges.map((b) => b.id));
  const memberSince = new Date(stats.user.createdAt).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  return (
    <div>
      <div className="profile-hero">
        <Avatar
          name={stats.user.name ?? stats.user.email}
          hue={stats.user.avatarHue}
          size="xl"
        />
        <div style={{ flex: 1 }}>
          <div className="h1" style={{ marginBottom: 4 }}>
            {stats.user.name ?? stats.user.email ?? "You"}
          </div>
          <div className="muted" style={{ marginBottom: 8 }}>
            Joined {memberSince} · {stats.totalGames} games played
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag kind="coral">Best · {stats.bestScore}</Tag>
            {stats.globalRank > 0 && (
              <Tag kind="teal">Rank · #{stats.globalRank}</Tag>
            )}
            <Tag>{earnedIds.size} badges</Tag>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="col">
          <AvatarHueEditor
            name={stats.user.name ?? stats.user.email}
            initialHue={stats.user.avatarHue}
          />

          <div className="card card-pad">
            <h3 className="h2">Score progression</h3>
            {stats.history.length > 0 ? (
              <ScoreChart data={stats.history} />
            ) : (
              <div
                className="muted"
                style={{ padding: 24, textAlign: "center", fontSize: 13 }}
              >
                No runs yet.
              </div>
            )}
          </div>

          <AdSlot
            kind="leaderboard"
            label="Google AdSense · responsive (mid-profile)"
          />

          <div className="card card-pad">
            <h3 className="h2">Recent runs</h3>
            {stats.history.length === 0 ? (
              <div className="muted" style={{ fontSize: 13 }}>
                No runs yet.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Mode</th>
                    <th style={{ textAlign: "right" }}>Score</th>
                    <th style={{ textAlign: "right" }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.slice(0, 10).map((h) => (
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
                      <td className="mono muted" style={{ textAlign: "right" }}>
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
          <div className="card card-pad">
            <h3 className="h2">Badges</h3>
            <BadgesGrid all={allBadges} earnedIds={earnedIds} />
          </div>
          <AdSlot
            kind="rectangle"
            label="Google AdSense · 300×250 (profile sidebar)"
          />
        </div>
      </div>
    </div>
  );
}
