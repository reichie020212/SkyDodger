// Display helpers shared across screens.

import type { DifficultyApi } from "./engine-config";

export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  const m = Math.floor(seconds / 60);
  const r = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export function fmtAgo(t: number | Date): string {
  const ts = t instanceof Date ? t.getTime() : t;
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return Math.floor(d / 60) + "m ago";
  if (d < 86400) return Math.floor(d / 3600) + "h ago";
  return Math.floor(d / 86400) + "d ago";
}

const DIFF_TAG: Record<DifficultyApi, "green" | "teal" | "coral" | "red"> = {
  easy: "green",
  normal: "teal",
  hard: "coral",
  insane: "red",
};

export function diffTagKind(d: DifficultyApi): string {
  return DIFF_TAG[d] ?? "";
}
