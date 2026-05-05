import Link from "next/link";

export const metadata = {
  title: "Lost altitude · Sky Dodger",
};

export default function NotFound() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <div
          className="mono"
          style={{
            fontSize: 96,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--coral)",
            marginBottom: 12,
          }}
        >
          404
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          Lost altitude
        </div>
        <p
          className="muted"
          style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 24 }}
        >
          The page you&apos;re looking for didn&apos;t survive the obstacle
          course. Pick somewhere to land below.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/play" className="btn btn-coral">
            Try a run
          </Link>
          <Link href="/leaderboards" className="btn btn-ghost">
            See leaderboards
          </Link>
        </div>
      </div>
    </div>
  );
}
