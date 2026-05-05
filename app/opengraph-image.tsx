import { ImageResponse } from "next/og";

export const alt = "Sky Dodger — fly, dodge, climb the leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #a3d4e5, #cfe7ee 55%, #f0d9b5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          color: "#221e32",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #e07a4f, #a44520)",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 700 }}>Sky Dodger</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              fontWeight: 700,
              maxWidth: 980,
            }}
          >
            Fly, dodge, climb the leaderboard.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#4b4860",
              maxWidth: 820,
            }}
          >
            A flappy-bird-style web game with persistent leaderboards,
            badges, and four difficulty modes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 20,
            color: "#4b4860",
          }}
        >
          <span>Easy</span>
          <span>·</span>
          <span>Normal</span>
          <span>·</span>
          <span>Hard</span>
          <span>·</span>
          <span>Insane</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
