# Sky Dodger

A Flappy-Bird-style web game with persistent leaderboards, badges, and
four difficulty modes. Built on Next.js 14 (App Router), TypeScript,
Prisma + Vercel Postgres, NextAuth v5 (Google OAuth), Recharts, and
Google AdSense.

| Doc | What's in it |
| --- | --- |
| [`DEPLOY.md`](./DEPLOY.md) | Setup for local + production, env vars, Google OAuth + AdSense walkthroughs, troubleshooting |
| [`BLUEPRINT.md`](./BLUEPRINT.md) | The architect's per-phase implementation plan (historical, but useful for orientation) |
| [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md) | The original spec — API contracts, anti-cheat rules, acceptance criteria |
| [`legacy/`](./legacy/) | The HTML/React prototype the production app was ported from. Immutable design reference; do not import from it |

## Quickstart (anonymous play, no setup)

Anonymous play needs neither a database nor OAuth — session-best is in
`localStorage`, ad slots render placeholders.

```bash
pnpm install
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env.local
pnpm dev
```

Open <http://localhost:3000>. For full setup (DB, sign-in, score
persistence, leaderboards) see [`DEPLOY.md`](./DEPLOY.md).

## Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server (HMR on) |
| `pnpm build` | Production build (typecheck + lint + bundle) |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint (Next.js config) |
| `pnpm test` | Vitest one-shot (23 tests) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:migrate` | Run / create migrations against the dev database |
| `pnpm db:seed` | Run `prisma/seed.ts` to populate static tables |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture notes

- `lib/engine.ts` — typed port of the prototype's canvas engine.
  Difficulty values must stay in sync with `lib/anti-cheat.ts`'s
  `MIN_MS_PER_PIPE` table — don't tune one without the other.
- `lib/scores.ts` — period filters, leaderboard query, user stats and
  global rank.
- `lib/badges.ts` — per-badge rule map + `checkAndAwardBadges(userId)`,
  called after every score insert.
- `lib/rate-limit.ts` — in-memory leaky bucket per user (3 s cooldown).
  Imperfect across serverless cold starts; the duration plausibility
  check in `lib/anti-cheat.ts` is the real defense.
- `lib/auth.ts` — NextAuth v5 + Google + Prisma adapter. The
  `events.createUser` hook randomizes `avatarHue` at signup; `/profile`
  lets the user retune it via a Server Action (`lib/actions.ts`).
- `app/(auth)/layout.tsx` — auth-gates `/dashboard` and `/profile`,
  redirects unsigned users to `/play`.
- `lib/adsense.ts` + `components/AdSlot.tsx` — kind → format/dimensions
  table, real `<ins class="adsbygoogle">` rendering when env is
  configured, labeled placeholder fallback otherwise.

## Routes

| Path | Auth | What |
| --- | --- | --- |
| `/` | — | 307 → `/play` |
| `/play` | optional | Game; signed-in players persist scores |
| `/leaderboards` | — | Top 50 with period + difficulty filters |
| `/dashboard` | required | Stats, score chart, badges, recent runs |
| `/profile` | required | Hero, hue editor, score chart, badges |
| `/u/[id]` | — | Public profile (no email, no editor) |
| `POST /api/scores` | required | Submit a run |
| `GET /api/leaderboards` | — | Same data the page uses |
| `GET /api/me` | required | Same as `/dashboard` payload |
| `GET /api/users/[id]` | — | Same as `/u/[id]` payload |
| `… /api/auth/[...nextauth]` | — | NextAuth handler |

## Tests

`pnpm test` runs 23 unit tests across:

- `lib/anti-cheat.test.ts` — score/duration plausibility boundaries
- `lib/scores.test.ts` — `getPeriodStart` for each window
- `lib/badges.test.ts` — `computeConsecutiveDays` (streak math)
- `lib/rate-limit.test.ts` — cooldown gating with fake timers

Prisma-mocking integration tests for the API routes are deferred
(meaningful logic is covered by the units above).
