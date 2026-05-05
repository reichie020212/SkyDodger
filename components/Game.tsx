"use client";

import { useEffect, useRef } from "react";
import type { Difficulty } from "@prisma/client";
import {
  createGame,
  type GameInstance,
  type GameOverPayload,
} from "@/lib/engine";

export type GameProps = {
  difficulty: Difficulty;
  soundOn?: boolean;
  onScore?: (score: number) => void;
  onGameOver?: (payload: GameOverPayload) => void;
  className?: string;
};

export function Game({
  difficulty,
  soundOn = true,
  onScore,
  onGameOver,
  className,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameInstance | null>(null);

  // Stable callback refs so we don't tear down the engine on every render.
  const onScoreRef = useRef(onScore);
  const onGameOverRef = useRef(onGameOver);
  onScoreRef.current = onScore;
  onGameOverRef.current = onGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createGame(canvas, {
      difficulty,
      soundOn,
      onScore: (s) => onScoreRef.current?.(s),
      onGameOver: (p) => onGameOverRef.current?.(p),
    });
    engineRef.current = engine;
    engine.start();

    const handleKey = (e: KeyboardEvent) => engine.handleInput(e);
    const handlePointer = (e: PointerEvent) => engine.handleInput(e);
    const handleResize = () => engine.resize();

    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("pointerdown", handlePointer);
    window.addEventListener("resize", handleResize);

    return () => {
      engine.stop();
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("resize", handleResize);
      engineRef.current = null;
    };
    // We intentionally exclude difficulty/soundOn from deps; their changes
    // are propagated by the dedicated effects below so the engine is not
    // recreated mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setDifficulty(difficulty);
  }, [difficulty]);

  useEffect(() => {
    engineRef.current?.setSound(soundOn);
  }, [soundOn]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
      }}
    />
  );
}
