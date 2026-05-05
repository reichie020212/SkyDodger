// Sky Dodger — game engine, ported from legacy/engine.js to TypeScript.
// Behavior is intentionally identical; only the API surface (types,
// uppercase difficulty keys to match the Prisma enum) has changed. Do
// not tune the difficulty values without re-running the anti-cheat math
// in lib/anti-cheat.ts.

import type { Difficulty } from "@prisma/client";
import { DIFFICULTY } from "./engine-config";

export type GameMode = "idle" | "playing" | "dead";

export type Bird = { x: number; y: number; vy: number; r: number; rot: number };
export type Pipe = { x: number; gapY: number; gapH: number; scored: boolean };
export type Cloud = { x: number; y: number; size: number; speed: number };

export type GameOverPayload = {
  score: number;
  durationMs: number;
  difficulty: Difficulty;
};

export type GameOptions = {
  difficulty?: Difficulty;
  soundOn?: boolean;
  onScore?: (score: number) => void;
  onGameOver?: (payload: GameOverPayload) => void;
};

export type GameInstance = {
  start: () => void;
  stop: () => void;
  reset: () => void;
  jump: () => void;
  setDifficulty: (d: Difficulty) => void;
  setSound: (on: boolean) => void;
  handleInput: (e: KeyboardEvent | PointerEvent | MouseEvent | TouchEvent) => void;
  resize: () => void;
  getMode: () => GameMode;
  getScore: () => number;
};

type AudioCtor = typeof AudioContext;

function getAudioContextCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { webkitAudioContext?: AudioCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export function createGame(
  canvas: HTMLCanvasElement,
  opts: GameOptions = {},
): GameInstance {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sky Dodger: 2D canvas context unavailable.");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const state = {
    mode: "idle" as GameMode,
    difficulty: (opts.difficulty ?? "NORMAL") as Difficulty,
    bird: { x: 0, y: 0, vy: 0, r: 16, rot: 0 } satisfies Bird,
    pipes: [] as Pipe[],
    clouds: [] as Cloud[],
    bgScroll: 0,
    score: 0,
    distance: 0,
    startTime: 0,
    durationMs: 0,
    soundOn: opts.soundOn !== false,
  };

  const onScore = opts.onScore ?? (() => {});
  const onGameOver = opts.onGameOver ?? (() => {});

  const cfg = () => DIFFICULTY[state.difficulty];

  function reset() {
    resize();
    state.bird.x = W * 0.28;
    state.bird.y = H * 0.45;
    state.bird.vy = 0;
    state.bird.rot = 0;
    state.pipes = [];
    state.score = 0;
    state.distance = 0;
    state.bgScroll = 0;
    state.startTime = performance.now();
    state.durationMs = 0;
    state.mode = "idle";

    state.clouds = [];
    for (let i = 0; i < 5; i++) {
      state.clouds.push({
        x: Math.random() * W,
        y: 30 + Math.random() * (H * 0.4),
        size: 24 + Math.random() * 36,
        speed: 0.2 + Math.random() * 0.4,
      });
    }
    spawnPipe(W + 80);
    spawnPipe(W + 80 + cfg().spawnDist);
  }

  function spawnPipe(x: number) {
    const c = cfg();
    const margin = 80;
    const minY = margin + c.pipeGap / 2;
    const maxY = H - margin - c.pipeGap / 2;
    const gapY = minY + Math.random() * (maxY - minY);
    state.pipes.push({ x, gapY, gapH: c.pipeGap, scored: false });
  }

  function jump() {
    if (state.mode === "idle") {
      state.mode = "playing";
      state.startTime = performance.now();
    }
    if (state.mode === "playing") {
      state.bird.vy = cfg().jump;
      playSound("jump");
    }
  }

  let audioCtx: AudioContext | null = null;

  function playSound(kind: "jump" | "score" | "crash") {
    if (!state.soundOn) return;
    try {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return;
      audioCtx = audioCtx ?? new Ctor();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      if (kind === "jump") {
        o.frequency.setValueAtTime(380, t);
        o.frequency.exponentialRampToValueAtTime(560, t + 0.08);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.start(t);
        o.stop(t + 0.12);
      } else if (kind === "score") {
        o.frequency.setValueAtTime(680, t);
        o.frequency.exponentialRampToValueAtTime(880, t + 0.08);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t);
        o.stop(t + 0.18);
      } else {
        o.type = "sawtooth";
        o.frequency.setValueAtTime(280, t);
        o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t);
        o.stop(t + 0.38);
      }
    } catch {
      /* audio unavailable — silently degrade */
    }
  }

  function gameOver() {
    if (state.mode === "dead") return;
    state.mode = "dead";
    state.durationMs = performance.now() - state.startTime;
    playSound("crash");
    onGameOver({
      score: state.score,
      durationMs: state.durationMs,
      difficulty: state.difficulty,
    });
  }

  function update() {
    const c = cfg();

    if (state.mode === "playing") {
      state.bird.vy += c.gravity;
      state.bird.y += state.bird.vy;
      state.bird.rot = Math.max(-0.5, Math.min(1.2, state.bird.vy * 0.07));
      state.distance += c.pipeSpeed;

      for (const p of state.pipes) {
        p.x -= c.pipeSpeed;
        if (!p.scored && p.x + 30 < state.bird.x) {
          p.scored = true;
          state.score += 1;
          onScore(state.score);
          playSound("score");
        }
      }
      state.pipes = state.pipes.filter((p) => p.x > -80);

      const last = state.pipes[state.pipes.length - 1];
      if (!last || last.x < W - c.spawnDist) spawnPipe(W + 40);

      const b = state.bird;
      if (b.y + b.r > H - 20 || b.y - b.r < 0) {
        b.y = Math.max(b.r, Math.min(H - 20 - b.r, b.y));
        gameOver();
        return;
      }
      for (const p of state.pipes) {
        const pipeW = 60;
        if (b.x + b.r > p.x && b.x - b.r < p.x + pipeW) {
          if (
            b.y - b.r < p.gapY - p.gapH / 2 ||
            b.y + b.r > p.gapY + p.gapH / 2
          ) {
            gameOver();
            return;
          }
        }
      }
    } else if (state.mode === "idle") {
      state.bird.y = H * 0.45 + Math.sin(performance.now() / 300) * 6;
    } else {
      state.bird.vy += c.gravity * 1.2;
      state.bird.y += state.bird.vy;
      if (state.bird.y > H + 40) state.bird.y = H + 40;
      state.bird.rot = Math.min(1.5, state.bird.rot + 0.08);
    }

    if (state.mode !== "dead") state.bgScroll += c.pipeSpeed * 0.3;
    for (const cl of state.clouds) {
      cl.x -= cl.speed;
      if (cl.x < -cl.size) {
        cl.x = W + cl.size;
        cl.y = 30 + Math.random() * (H * 0.4);
      }
    }
  }

  function draw() {
    const grd = ctx!.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#a3d4e5");
    grd.addColorStop(0.6, "#cfe7ee");
    grd.addColorStop(1, "#f0d9b5");
    ctx!.fillStyle = grd;
    ctx!.fillRect(0, 0, W, H);

    ctx!.fillStyle = "rgba(255,255,255,0.85)";
    for (const cl of state.clouds) drawCloud(cl.x, cl.y, cl.size);

    ctx!.fillStyle = "rgba(120, 150, 130, 0.5)";
    drawHills(H * 0.7, 50, state.bgScroll * 0.3);
    ctx!.fillStyle = "rgba(90, 130, 110, 0.7)";
    drawHills(H * 0.78, 40, state.bgScroll * 0.5);

    for (const p of state.pipes) drawPipe(p);

    const groundY = H - 20;
    ctx!.fillStyle = "#d9b07c";
    ctx!.fillRect(0, groundY, W, 20);
    ctx!.fillStyle = "#c9a06c";
    ctx!.fillRect(0, groundY, W, 4);
    ctx!.fillStyle = "rgba(0,0,0,0.06)";
    const offset = state.bgScroll % 16;
    for (let x = -offset; x < W; x += 16) {
      ctx!.fillRect(x, groundY + 8, 8, 4);
    }

    drawBird(state.bird);

    if (state.mode === "idle") {
      ctx!.fillStyle = "rgba(34, 30, 50, 0.7)";
      ctx!.font = '600 18px "Space Grotesk", sans-serif';
      ctx!.textAlign = "center";
      ctx!.fillText("Tap or press Space", W / 2, H * 0.32);
      ctx!.font = '500 13px "Space Grotesk", sans-serif';
      ctx!.fillText("to start flying", W / 2, H * 0.32 + 22);
    }
  }

  function drawCloud(x: number, y: number, s: number) {
    ctx!.beginPath();
    ctx!.arc(x, y, s * 0.5, 0, Math.PI * 2);
    ctx!.arc(x + s * 0.4, y - s * 0.1, s * 0.4, 0, Math.PI * 2);
    ctx!.arc(x + s * 0.7, y + s * 0.05, s * 0.45, 0, Math.PI * 2);
    ctx!.arc(x + s * 0.25, y + s * 0.15, s * 0.4, 0, Math.PI * 2);
    ctx!.fill();
  }

  function drawHills(baseY: number, amp: number, scroll: number) {
    ctx!.beginPath();
    ctx!.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = baseY + Math.sin((x + scroll) * 0.012) * amp;
      ctx!.lineTo(x, y);
    }
    ctx!.lineTo(W, H);
    ctx!.closePath();
    ctx!.fill();
  }

  function drawPipe(p: Pipe) {
    const w = 60;
    const capH = 22;
    const topH = p.gapY - p.gapH / 2;
    const botY = p.gapY + p.gapH / 2;
    const botH = H - botY - 20;

    const bodyGrd = ctx!.createLinearGradient(p.x, 0, p.x + w, 0);
    bodyGrd.addColorStop(0, "#c2562a");
    bodyGrd.addColorStop(0.3, "#e07a4f");
    bodyGrd.addColorStop(0.6, "#d66a3f");
    bodyGrd.addColorStop(1, "#a44520");
    ctx!.fillStyle = bodyGrd;
    ctx!.fillRect(p.x, 0, w, topH);
    ctx!.fillRect(p.x, botY, w, botH);

    const capGrd = ctx!.createLinearGradient(p.x - 4, 0, p.x + w + 4, 0);
    capGrd.addColorStop(0, "#a44520");
    capGrd.addColorStop(0.5, "#e07a4f");
    capGrd.addColorStop(1, "#8a3915");
    ctx!.fillStyle = capGrd;
    ctx!.fillRect(p.x - 4, topH - capH, w + 8, capH);
    ctx!.fillRect(p.x - 4, botY, w + 8, capH);

    ctx!.fillStyle = "rgba(255,255,255,0.18)";
    ctx!.fillRect(p.x + 6, 0, 4, topH);
    ctx!.fillRect(p.x + 6, botY, 4, botH);
  }

  function drawBird(b: Bird) {
    ctx!.save();
    ctx!.translate(b.x, b.y);
    ctx!.rotate(b.rot);

    const bodyGrd = ctx!.createRadialGradient(-4, -4, 4, 0, 0, 18);
    bodyGrd.addColorStop(0, "#fff1d6");
    bodyGrd.addColorStop(0.5, "#f6c557");
    bodyGrd.addColorStop(1, "#d99a25");
    ctx!.fillStyle = bodyGrd;
    ctx!.beginPath();
    ctx!.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
    ctx!.fill();

    ctx!.fillStyle = "#fff5e0";
    ctx!.beginPath();
    ctx!.ellipse(2, 4, 10, 7, 0, 0, Math.PI * 2);
    ctx!.fill();

    const wingFlap = Math.sin(performance.now() / 80) * 0.4;
    ctx!.save();
    ctx!.translate(-2, 1);
    ctx!.rotate(wingFlap);
    ctx!.fillStyle = "#c9851e";
    ctx!.beginPath();
    ctx!.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = "#e8a834";
    ctx!.beginPath();
    ctx!.ellipse(0, -1, 7, 3.5, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();

    ctx!.fillStyle = "white";
    ctx!.beginPath();
    ctx!.arc(8, -4, 4, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = "#221e32";
    ctx!.beginPath();
    ctx!.arc(9, -4, 2, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = "white";
    ctx!.beginPath();
    ctx!.arc(9.5, -4.8, 0.7, 0, Math.PI * 2);
    ctx!.fill();

    ctx!.fillStyle = "#e87a3f";
    ctx!.beginPath();
    ctx!.moveTo(14, -1);
    ctx!.lineTo(22, 1);
    ctx!.lineTo(14, 3);
    ctx!.closePath();
    ctx!.fill();
    ctx!.fillStyle = "#c25a25";
    ctx!.beginPath();
    ctx!.moveTo(14, 1);
    ctx!.lineTo(22, 1);
    ctx!.lineTo(14, 3);
    ctx!.closePath();
    ctx!.fill();

    ctx!.restore();
  }

  let raf = 0;
  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    reset();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(raf);
  }

  function handleInput(
    e: KeyboardEvent | PointerEvent | MouseEvent | TouchEvent,
  ) {
    if ("type" in e && e.type === "keydown") {
      const k = e as KeyboardEvent;
      if (k.code !== "Space") return;
      k.preventDefault();
    }
    jump();
  }

  return {
    start,
    stop,
    reset,
    jump,
    setDifficulty(d: Difficulty) {
      state.difficulty = d;
    },
    setSound(on: boolean) {
      state.soundOn = on;
    },
    handleInput,
    resize,
    getMode: () => state.mode,
    getScore: () => state.score,
  };
}

export { DIFFICULTY };
