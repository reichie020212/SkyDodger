"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DifficultyApi } from "@/lib/engine-config";

export type ScoreChartPoint = {
  createdAt: Date | string | number;
  score: number;
  difficulty: DifficultyApi;
};

const CORAL = "oklch(0.55 0.18 32)";
const GRID = "oklch(0.88 0.015 85)";
const INK_3 = "oklch(0.62 0.015 280)";

function formatDay(value: number | string | Date): string {
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type Datum = {
  ts: number;
  label: string;
  score: number;
  difficulty: DifficultyApi;
};

type RechartsTooltipPayload = {
  active?: boolean;
  payload?: Array<{ payload?: Datum }>;
};

function ChartTooltip(props: RechartsTooltipPayload) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div
      className="card card-pad"
      style={{ padding: "8px 10px", fontSize: 12 }}
    >
      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
        {d.score}
      </div>
      <div className="muted">
        {d.label} · {d.difficulty}
      </div>
    </div>
  );
}

export function ScoreChartInner({
  data,
  height = 220,
}: {
  data: ScoreChartPoint[];
  height?: number;
}) {
  const points: Datum[] = data
    .map((p) => ({
      ts: new Date(p.createdAt).getTime(),
      label: formatDay(p.createdAt),
      score: p.score,
      difficulty: p.difficulty,
    }))
    .sort((a, b) => a.ts - b.ts);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
        >
          <defs>
            <linearGradient id="sd-coral-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CORAL} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CORAL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: INK_3, fontSize: 10, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: INK_3, fontSize: 10, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={CORAL}
            strokeWidth={2}
            fill="url(#sd-coral-area)"
            dot={{ r: 3, fill: "oklch(0.99 0.008 85)", stroke: CORAL, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
