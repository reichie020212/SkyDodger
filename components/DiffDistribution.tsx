import type { DifficultyApi } from "@/lib/engine-config";

const ORDER: DifficultyApi[] = ["easy", "normal", "hard", "insane"];
const COLORS: Record<DifficultyApi, string> = {
  easy: "var(--green)",
  normal: "var(--teal)",
  hard: "var(--coral)",
  insane: "var(--red)",
};

export function DiffDistribution({
  history,
}: {
  history: Array<{ difficulty: DifficultyApi }>;
}) {
  const counts: Record<DifficultyApi, number> = {
    easy: 0,
    normal: 0,
    hard: 0,
    insane: 0,
  };
  for (const h of history) counts[h.difficulty] += 1;
  const total = history.length || 1;

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--bg-deep)",
        }}
      >
        {ORDER.map((d) => {
          const w = (counts[d] / total) * 100;
          if (!w) return null;
          return (
            <div
              key={d}
              style={{ width: w + "%", background: COLORS[d] }}
              title={`${d}: ${counts[d]}`}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        {ORDER.map((d) => (
          <div
            key={d}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: COLORS[d],
              }}
            />
            <span style={{ textTransform: "capitalize" }}>{d}</span>
            <span className="mono muted">{counts[d]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
