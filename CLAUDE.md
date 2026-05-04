# Sky Dodger — Claude Code Instructions

## What this repo is

Sky Dodger is a Flappy-Bird-style web game. The repo currently holds an
HTML/React prototype (`Sky Dodger.html`, `engine.js`, `data.js`,
`components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx`,
`styles.css`). The prototype is the **design and behavior spec** — pixel
layout, copy, color tokens, and game feel must be matched exactly when
porting.

The build target is a deployable **Next.js 14 (App Router) + TypeScript**
app on Vercel with a Postgres + Prisma backend, NextAuth.js v5 (Google),
Recharts, and Google AdSense across 6 placements.

## The source of truth

Read [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md) before doing any
work. It is the full implementation brief — tech stack, project
structure, Prisma schema, API contracts, anti-cheat rules, AdSense
policy, environment variables, tests, README requirements, acceptance
criteria, and the required implementation order:

> Prisma schema + migration → NextAuth → API routes → port engine →
> port screens → AdSense integration → tests → README

If anything in this file conflicts with `CLAUDE_CODE_PROMPT.md`, the
prompt wins for project scope; this file wins for workflow.

## Workflow rules

### No git worktrees on this project
Do **not** create a git worktree for work on this repo. Commit directly
on the active branch (default: `main`) unless Red explicitly says
otherwise. This overrides the global worktree workflow in `~/.claude/CLAUDE.md`.

### Don't redesign — port
Match the prototype 1:1. If you find yourself inventing new layout,
copy, colors, or features, stop and ask Red. Pause on ambiguity rather
than improvising — the architect (Gemini) is the one to consult on
design or schema changes.

### Architect / Executor split
Per Red's global rules, on project work Gemini is the architect and
Claude is the executor. If the prompt is ambiguous or a roadblock
requires a design or schema change, re-consult Gemini via `/ask gemini`
rather than improvising.

### Linting and formatting (once the Next.js project is scaffolded)
Run the project's formatter/linter before every commit (e.g.
`pnpm prettier --write`, `pnpm eslint --fix`, `pnpm tsc --noEmit`).
Don't skip pre-commit hooks. If a hook fails, fix the underlying issue
and create a new commit — don't `--no-verify` and don't amend.

### Git commits
- Always sign: `git commit -s -S -m "..."`.
- Use Conventional Commits prefixes (`feat:`, `fix:`, `refactor:`,
  `chore:`, `docs:`, `test:`).
- Do **not** add `Co-Authored-By: Claude` or any "Generated with Claude
  Code" footer. The `Signed-off-by` from `-s` is Red's, not yours.

### Anti-cheat and AdSense policy are real
- Score-submission rate limit and plausibility checks are not optional —
  see `CLAUDE_CODE_PROMPT.md` §Anti-cheat.
- AdSense policy compliance: keep "Advertisement" labels, no ads on the
  game canvas, and the ≥1s delay before the game-over interstitial is
  required. Don't quietly drop these.

## Local files Claude should keep in context

When porting screens or wiring the engine, open these prototype files so
the output matches:

- `Sky Dodger.html` — entry, ad placement layout, font imports
- `styles.css` — design tokens (colors, type, spacing, radii, shadows)
- `engine.js` — game engine + difficulty config (port to TS verbatim)
- `data.js` — `BADGES` array (seed source) and data shapes for `Score`/`User`
- `components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx` —
  component layout, copy, ad slot positions
