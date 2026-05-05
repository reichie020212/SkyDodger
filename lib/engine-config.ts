// Difficulty configuration shared between the game engine (lib/engine.ts,
// ported in Phase 4) and the server-side anti-cheat. Values are taken
// verbatim from legacy/engine.js — do not tune without re-running the
// anti-cheat math in lib/anti-cheat.ts.

import type { Difficulty } from "@prisma/client";

export type DifficultyConfig = {
  gravity: number;
  jump: number;
  pipeSpeed: number;
  pipeGap: number;
  spawnDist: number;
  label: string;
  color: string;
};

export const DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  EASY:   { gravity: 0.42, jump: -7.2, pipeSpeed: 2.2, pipeGap: 200, spawnDist: 280, label: "Easy",   color: "var(--green)" },
  NORMAL: { gravity: 0.5,  jump: -7.6, pipeSpeed: 2.8, pipeGap: 170, spawnDist: 250, label: "Normal", color: "var(--teal)"  },
  HARD:   { gravity: 0.58, jump: -7.9, pipeSpeed: 3.4, pipeGap: 140, spawnDist: 220, label: "Hard",   color: "var(--coral)" },
  INSANE: { gravity: 0.66, jump: -8.2, pipeSpeed: 4.2, pipeGap: 115, spawnDist: 195, label: "Insane", color: "var(--red)"   },
};

// Minimum milliseconds it takes for one pipe to traverse the spawnDist
// at 60fps. Used by the anti-cheat to reject scores whose durationMs is
// implausibly short for the number of pipes claimed.
const FRAME_MS = 1000 / 60;

export const MIN_MS_PER_PIPE: Record<Difficulty, number> = {
  EASY:   (DIFFICULTY.EASY.spawnDist   / DIFFICULTY.EASY.pipeSpeed)   * FRAME_MS,
  NORMAL: (DIFFICULTY.NORMAL.spawnDist / DIFFICULTY.NORMAL.pipeSpeed) * FRAME_MS,
  HARD:   (DIFFICULTY.HARD.spawnDist   / DIFFICULTY.HARD.pipeSpeed)   * FRAME_MS,
  INSANE: (DIFFICULTY.INSANE.spawnDist / DIFFICULTY.INSANE.pipeSpeed) * FRAME_MS,
};

export const DIFFICULTY_API = ["easy", "normal", "hard", "insane"] as const;
export type DifficultyApi = (typeof DIFFICULTY_API)[number];

export function apiToEnum(d: DifficultyApi): Difficulty {
  return d.toUpperCase() as Difficulty;
}

export function enumToApi(d: Difficulty): DifficultyApi {
  return d.toLowerCase() as DifficultyApi;
}
