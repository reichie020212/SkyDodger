"use client";

import dynamic from "next/dynamic";
import type { ScoreChartPoint } from "./ScoreChartInner";

// Defer Recharts (~100 kB) off the initial JS payload. The chart only
// renders after hydration anyway (ResponsiveContainer needs the client
// to size itself), so SSR is disabled.
const ScoreChartInner = dynamic(
  () => import("./ScoreChartInner").then((m) => m.ScoreChartInner),
  {
    ssr: false,
    loading: () => <ScoreChartSkeleton />,
  },
);

function ScoreChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(180deg, oklch(0.55 0.18 32 / 0.04), oklch(0.55 0.18 32 / 0))",
        borderRadius: 8,
      }}
    >
      <div
        className="muted mono"
        style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        loading chart…
      </div>
    </div>
  );
}

export function ScoreChart({
  data,
  height = 220,
}: {
  data: ScoreChartPoint[];
  height?: number;
}) {
  return <ScoreChartInner data={data} height={height} />;
}

export type { ScoreChartPoint };
