"use client";

import { useCallback, useEffect, useState } from "react";
import type { Difficulty } from "@prisma/client";
import { Game } from "./Game";
import { DifficultyPicker } from "./DifficultyPicker";
import { Toggle } from "./Toggle";
import { Tag } from "./Tag";
import { AdSlot } from "./AdSlot";
import { SignInButton } from "./SignInButton";
import { fmtTime, diffTagKind } from "@/lib/format";
import { enumToApi } from "@/lib/engine-config";
import type { GameOverPayload } from "@/lib/engine";

type Phase = "menu" | "playing" | "gameover";

export type GameScreenProps = {
  signedIn: boolean;
  initialDifficulty?: Difficulty;
};

const STORAGE_KEY = "sd_anon_best";

export function GameScreen({
  signedIn,
  initialDifficulty = "NORMAL",
}: GameScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [soundOn, setSoundOn] = useState(true);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [bestThisSession, setBestThisSession] = useState(0);
  const [lastResult, setLastResult] = useState<GameOverPayload | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [interstitialReady, setInterstitialReady] = useState(false);

  // Load anonymous best from localStorage on mount.
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
      if (Number.isFinite(v) && v > 0) setBestThisSession(v);
    } catch {
      /* ignore */
    }
  }, []);

  const handleScore = useCallback((s: number) => setScore(s), []);

  const handleGameOver = useCallback(
    (payload: GameOverPayload) => {
      setLastResult(payload);
      setBestThisSession((b) => {
        const next = Math.max(b, payload.score);
        if (!signedIn) {
          try {
            localStorage.setItem(STORAGE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
      setPhase("gameover");
      setInterstitialReady(false);

      if (signedIn) {
        setSaveStatus("saving");
        fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: payload.score,
            difficulty: enumToApi(payload.difficulty),
            durationMs: Math.round(payload.durationMs),
          }),
        })
          .then((res) => (res.ok ? setSaveStatus("saved") : setSaveStatus("error")))
          .catch(() => setSaveStatus("error"));
      }
    },
    [signedIn],
  );

  // Game-over interstitial delay (≥1s) — AdSense policy guard against
  // accidental clicks immediately after a player sees their score.
  useEffect(() => {
    if (phase !== "gameover") return;
    const t = setTimeout(() => setInterstitialReady(true), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  function startGame() {
    setScore(0);
    setSaveStatus("idle");
    setPhase("playing");
  }

  function backToMenu() {
    setScore(0);
    setSaveStatus("idle");
    setPhase("menu");
  }

  return (
    <div className="grid-2">
      <div>
        <div
          style={{ marginBottom: 16, display: "none" }}
          className="ad-desktop-only"
        >
          <AdSlot kind="leaderboard" />
        </div>

        <div className="game-frame">
          <div className="game-canvas-wrap">
            <Game
              key={phase === "playing" ? "live" : "idle"}
              difficulty={difficulty}
              soundOn={soundOn}
              onScore={handleScore}
              onGameOver={handleGameOver}
            />

            {phase === "playing" && (
              <div className="hud-top">
                <div />
                <div className="hud-score mono">{score}</div>
                <div
                  className="hud-pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoundOn((s) => !s);
                  }}
                >
                  {soundOn ? "♪ ON" : "♪ OFF"}
                </div>
              </div>
            )}

            {phase === "menu" && (
              <div className="overlay">
                <div className="overlay-card">
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ink-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    {signedIn ? "Saving to your account" : "Anonymous play"}
                  </div>
                  <h2
                    style={{
                      margin: "0 0 18px",
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Choose difficulty
                  </h2>
                  <DifficultyPicker value={difficulty} onChange={setDifficulty} />
                  <button
                    className="btn btn-coral btn-lg"
                    style={{
                      width: "100%",
                      marginTop: 18,
                      justifyContent: "center",
                    }}
                    onClick={startGame}
                  >
                    Start flying
                  </button>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 14,
                      fontSize: 12,
                    }}
                  >
                    <span className="muted">Tap, click, or press Space</span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted">Sound</span>
                      <Toggle on={soundOn} onChange={setSoundOn} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {phase === "gameover" && lastResult && (
              <div className="overlay">
                <div className="overlay-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--ink-3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 4,
                        }}
                      >
                        Run complete
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 56,
                          fontWeight: 700,
                          lineHeight: 1,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {lastResult.score}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        obstacles passed
                      </div>
                    </div>
                    <Tag kind={diffTagKind(enumToApi(lastResult.difficulty)) as "" | "green" | "teal" | "coral" | "red"}>
                      {enumToApi(lastResult.difficulty)}
                    </Tag>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--line)",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>
                        Time
                      </div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                        {fmtTime(lastResult.durationMs / 1000)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>
                        Best (session)
                      </div>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                        {Math.max(bestThisSession, lastResult.score)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="muted" style={{ fontSize: 11 }}>
                        Status
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: signedIn
                            ? saveStatus === "saved"
                              ? "var(--green)"
                              : saveStatus === "error"
                                ? "var(--red)"
                                : "var(--ink-3)"
                            : "var(--ink-3)",
                        }}
                      >
                        {signedIn
                          ? saveStatus === "saved"
                            ? "Saved ✓"
                            : saveStatus === "saving"
                              ? "Saving…"
                              : saveStatus === "error"
                                ? "Save failed"
                                : "Pending"
                          : "Not saved"}
                      </div>
                    </div>
                  </div>

                  {!signedIn && (
                    <div
                      style={{
                        background: "oklch(0.62 0.14 195 / 0.08)",
                        border: "1px solid oklch(0.62 0.14 195 / 0.2)",
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Sign in to save?
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-2)",
                          lineHeight: 1.45,
                          marginBottom: 10,
                        }}
                      >
                        Track your progress, climb the global leaderboard, earn
                        badges.
                      </div>
                      <SignInButton size="sm" fullWidth callbackUrl="/play" />
                    </div>
                  )}

                  {interstitialReady && (
                    <div style={{ marginBottom: 14 }}>
                      <AdSlot
                        kind="interstitial"
                        label="Google AdSense · 300×250 (game-over)"
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: "center" }}
                      onClick={backToMenu}
                    >
                      Menu
                    </button>
                    <button
                      className="btn btn-coral"
                      style={{ flex: 2, justifyContent: "center" }}
                      onClick={startGame}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 8px 2px",
              color: "oklch(0.78 0.01 280)",
              fontSize: 12,
            }}
          >
            <span>
              Mode: <span style={{ color: "white" }}>{difficulty.toLowerCase()}</span>
            </span>
            <span className="mono">Sky Dodger v1.0</span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <AdSlot
            kind="banner-mobile"
            label="Google AdSense · responsive banner (below-game)"
          />
        </div>
      </div>

      <div className="col">
        <div className="card card-pad">
          <h3 className="h3">How it works</h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: "var(--ink-2)",
              lineHeight: 1.7,
            }}
          >
            <li>
              Tap or press{" "}
              <span
                className="mono"
                style={{
                  background: "var(--bg-deep)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                Space
              </span>{" "}
              to flap
            </li>
            <li>Avoid the slabs · keep your altitude</li>
            <li>Each obstacle passed = 1 point</li>
            <li>Sign in to save runs and earn badges</li>
          </ul>
        </div>

        <AdSlot
          kind="rectangle"
          label="Google AdSense · 300×250 (sidebar)"
        />
      </div>
    </div>
  );
}
