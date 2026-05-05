"use client";

import { DIFFICULTY } from "@/lib/engine-config";
import type { Difficulty } from "@prisma/client";

const COLORS: Record<Difficulty, string> = {
  EASY: "var(--green)",
  NORMAL: "var(--teal)",
  HARD: "var(--coral)",
  INSANE: "var(--red)",
};

const ORDER: Difficulty[] = ["EASY", "NORMAL", "HARD", "INSANE"];

export function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
}) {
  return (
    <div className="diff-grid">
      {ORDER.map((k) => {
        const v = DIFFICULTY[k];
        return (
          <button
            key={k}
            className={"diff-card" + (value === k ? " selected" : "")}
            onClick={() => onChange(k)}
          >
            <div className="diff-name">
              <span className="diff-dot" style={{ background: COLORS[k] }} />
              {v.label}
            </div>
            <div className="diff-meta">
              gap {v.pipeGap}px · spd {v.pipeSpeed.toFixed(1)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
