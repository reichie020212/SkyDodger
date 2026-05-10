# Sky Dodger — Codex Instructions

## What this repo is

Sky Dodger is a Flappy-Bird-style web game. The production app
(Next.js 14 App Router + TypeScript + Prisma + NextAuth v5 + Recharts
+ AdSense) is the working tree at the root; the original HTML/React
prototype lives in [`legacy/`](./legacy/) as the immutable design
reference.

The eight-phase port specified in
[`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md) and
[`BLUEPRINT.md`](./BLUEPRINT.md) is **complete**. Future work is
iteration: bug fixes, polish, additional features, performance
tuning. There is no remaining "phase" backlog to follow.

## Where to look first

| Question | File |
| --- | --- |
| How do I run / deploy this? | [`DEPLOY.md`](./DEPLOY.md) |
| What's the high-level shape? | [`README.md`](./README.md) |
| What were the original spec + decisions? | [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md), [`BLUEPRINT.md`](./BLUEPRINT.md) |
| What does the prototype look like? | [`legacy/`](./legacy/) — read but don't import |

## Workflow rules

### No git worktrees on this project
Do **not** create a git worktree for work on this repo. Commit directly
on the active branch (default: `main`) unless Red explicitly says
otherwise. This overrides the global worktree workflow in
`~/.Codex/AGENTS.md`.

### Don't redesign — port
Match the prototype 1:1. The visual language is owned by
`app/sky-dodger.css` (a copy of `legacy/styles.css`). If you find
yourself inventing new layout, copy, colors, or features, stop and ask
Red. On ambiguity, re-consult Gemini via `/ask gemini` rather than
improvising.

### Architect / Executor split
On project work Gemini is the architect, Codex is the executor.
Schema or visible-design changes go through Gemini first. Pure
execution (boilerplate, tooling, refactors that don't change behavior)
doesn't require a re-consult.

### Code quality gates (run before committing)
- `pnpm tsc --noEmit` — typecheck
- `pnpm exec next lint` — lint
- `pnpm exec next build` — full build
- `pnpm test` — vitest (30 currently: 23 unit + 7 API route integration)

The same four run in `.github/workflows/ci.yml` on every push to
`main` and every PR — a green local run is expected to translate to a
green CI run. If a pre-commit hook fails, fix the underlying issue
and create a new commit — don't `--no-verify`, don't amend.

### Git commits
- Always sign: `git commit -s -S -m "..."`.
- Use Conventional Commits prefixes (`feat:`, `fix:`, `refactor:`,
  `chore:`, `docs:`, `test:`).
- Do **not** add `Co-Authored-By: Codex` or any "Generated with Codex
  Code" footer. The `Signed-off-by` from `-s` is Red's, not yours.

### Don't break the load-bearing invariants
- **Engine config.** `lib/engine-config.ts` `DIFFICULTY` values must
  match `legacy/engine.js`. The anti-cheat (`lib/anti-cheat.ts`) reads
  `MIN_MS_PER_PIPE` from there — tuning one without the other will
  reject legitimate runs or accept impossible ones.
- **API contract.** The four routes return camelCase keys with
  lowercase difficulty strings (`"easy" | "normal" | "hard" | "insane"`)
  even though Prisma uses the uppercase enum internally. Conversion
  happens at the API boundary via `apiToEnum` / `enumToApi`.
- **AdSense policy.** The ≥1s game-over interstitial delay
  (`GameScreen.tsx`'s `interstitialReady` effect) and the
  "Advertisement" label in `AdSlot.tsx` are policy requirements, not
  cosmetic. Don't quietly drop them.

## Setup tasks vs code tasks

When Red asks to "set up the local DB" or "deploy to Vercel," the
actions live in [`DEPLOY.md`](./DEPLOY.md). You can read the file and
guide Red through it, but the credentials (Google OAuth client,
AdSense slot IDs, Vercel Postgres provisioning) live in his accounts —
don't pretend you can retrieve or generate them yourself.
