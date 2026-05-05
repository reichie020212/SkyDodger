export function RankMedal({ rank }: { rank: number }) {
  const cls =
    rank === 1
      ? "rank-1"
      : rank === 2
        ? "rank-2"
        : rank === 3
          ? "rank-3"
          : "rank-other";
  return <div className={"rank-medal " + cls}>{rank}</div>;
}
