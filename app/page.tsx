export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Sky Dodger
        </h1>
        <p
          style={{
            marginTop: 16,
            fontSize: 18,
            lineHeight: 1.5,
            color: "var(--ink-2)",
          }}
        >
          Fly, dodge, climb the leaderboard. Production port in progress —
          scaffold verified.
        </p>
        <p
          className="mono"
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          Phase 0 · scaffold · {new Date().toISOString().slice(0, 10)}
        </p>
      </div>
    </main>
  );
}
