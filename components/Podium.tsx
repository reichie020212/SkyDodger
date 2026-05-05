import { Avatar } from "./Avatar";
import { Tag } from "./Tag";
import { diffTagKind } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/scores";
import type { TagKind } from "./Tag";

// 1st in the middle, 2nd on the left, 3rd on the right — matches the
// prototype's stepped podium layout.
export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const slots: Array<{ index: number; cls: string; height: number }> = [
    { index: 1, cls: "rank-2", height: 180 },
    { index: 0, cls: "rank-1", height: 220 },
    { index: 2, cls: "rank-3", height: 160 },
  ];
  const labelRank = (i: number) => i + 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginBottom: 22,
      }}
    >
      {slots.map(({ index, cls, height }) => {
        const r = rows[index];
        if (!r) return <div key={index} />;
        return (
          <div
            key={r.userId + "-" + r.createdAt}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              className="card"
              style={{
                padding: 18,
                textAlign: "center",
                height,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <Avatar name={r.name} hue={r.avatarHue} size="lg" />
              </div>
              <div
                className={"rank-medal " + cls}
                style={{ position: "absolute", top: 14, right: 14 }}
              >
                {labelRank(index)}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {r.name ?? "Anonymous"}
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
                {r.score}
              </div>
              <Tag kind={diffTagKind(r.difficulty) as TagKind}>{r.difficulty}</Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
}
