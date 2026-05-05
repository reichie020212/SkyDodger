import { LeaderboardTable } from "./LeaderboardTable";
import { AdSlot } from "./AdSlot";
import type { LeaderboardRow } from "@/lib/scores";

// Splits the rows at index 5 with an in-feed native ad in between, per
// the prototype's leaderboard layout. Honors AdSense's "advertisement
// label" requirement via AdSlot's built-in label.
export function LeaderboardTableWithAds({
  rows,
  currentUserId,
}: {
  rows: LeaderboardRow[];
  currentUserId?: string;
}) {
  const top = rows.slice(0, 5);
  const rest = rows.slice(5, 25);

  return (
    <div>
      <LeaderboardTable
        rows={top}
        showDifficulty
        showDuration
        currentUserId={currentUserId}
        startRank={1}
      />
      <div style={{ padding: "4px 12px" }}>
        <AdSlot
          kind="native"
          label="Google AdSense · in-feed native (between top 5 and rest)"
        />
      </div>
      {rest.length > 0 && (
        <LeaderboardTable
          rows={rest}
          showDifficulty
          showDuration
          currentUserId={currentUserId}
          startRank={6}
        />
      )}
    </div>
  );
}
