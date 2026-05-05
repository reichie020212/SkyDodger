import Link from "next/link";
import { Avatar } from "./Avatar";
import { Tag } from "./Tag";
import { RankMedal } from "./RankMedal";
import { fmtTime, fmtAgo, diffTagKind } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/scores";
import type { TagKind } from "./Tag";

export type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  showDifficulty?: boolean;
  showDuration?: boolean;
  currentUserId?: string;
  startRank?: number;
};

export function LeaderboardTable({
  rows,
  showDifficulty = true,
  showDuration = false,
  currentUserId,
  startRank = 1,
}: LeaderboardTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: 50 }}>#</th>
          <th>Player</th>
          <th style={{ width: 90, textAlign: "right" }}>Score</th>
          {showDifficulty && <th style={{ width: 80 }}>Mode</th>}
          {showDuration && <th style={{ width: 110 }}>Duration</th>}
          <th style={{ width: 90 }}>When</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const me = currentUserId && r.userId === currentUserId;
          const rank = startRank + i;
          return (
            <tr key={`${r.userId}-${r.createdAt}-${i}`} className={me ? "me" : ""}>
              <td>
                <RankMedal rank={rank} />
              </td>
              <td>
                <Link
                  href={`/u/${r.userId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <Avatar name={r.name} hue={r.avatarHue} />
                  <span style={{ fontWeight: me ? 700 : 500 }}>
                    {r.name ?? "Anonymous"}
                    {me && (
                      <span className="muted" style={{ fontWeight: 400 }}>
                        {" "}
                        · you
                      </span>
                    )}
                  </span>
                </Link>
              </td>
              <td
                className="mono"
                style={{ textAlign: "right", fontWeight: 700, fontSize: 15 }}
              >
                {r.score}
              </td>
              {showDifficulty && (
                <td>
                  <Tag kind={diffTagKind(r.difficulty) as TagKind}>
                    {r.difficulty}
                  </Tag>
                </td>
              )}
              {showDuration && (
                <td className="mono muted">{fmtTime(r.durationMs / 1000)}</td>
              )}
              <td className="muted" style={{ fontSize: 12 }}>
                {fmtAgo(r.createdAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
