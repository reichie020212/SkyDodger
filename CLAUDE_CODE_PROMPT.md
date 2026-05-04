# Sky Dodger — Backend Implementation Prompt for Claude Code

Use the prompt below verbatim with Claude Code. It assumes the existing HTML prototype (`Sky Dodger.html`, `engine.js`, `data.js`, `components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx`, `styles.css`) is the design source of truth — your job is to port it to a production Next.js app and wire up the real backend.

---

## Prompt to paste into Claude Code

> You are building the production backend and Next.js scaffolding for **Sky Dodger**, a Flappy-Bird-style web game. A working HTML/React prototype already exists in this repo (root files: `Sky Dodger.html`, `engine.js`, `data.js`, `components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx`, `styles.css`). Treat the prototype as the **design and behavior spec** — match its layout, copy, color tokens, and game feel exactly. Do not redesign anything.
>
> ### Goals
> 1. Port the prototype into a deployable **Next.js 14 (App Router) + TypeScript** project.
> 2. Replace the in-memory mock data (`data.js`, `SkyDodgerData`) with a real **Vercel Postgres + Prisma** backend.
> 3. Replace the mock sign-in modal with **NextAuth.js v5 + Google OAuth**.
> 4. Replace the hand-rolled SVG chart with **Recharts** while preserving the visual style.
> 5. Wire **Google AdSense** into every `<AdSlot>` placeholder shown in the prototype (keep all 6 placements: top leaderboard, sidebar 300×250, sticky 160×600 skyscraper, in-feed native between leaderboard rows, in-feed native between dashboard sections, and 300×250 interstitial on game over). Each ad must keep its "Advertisement" label and remain non-intrusive.
> 6. Ship a Vercel-ready repo: `vercel.json`, env example, Prisma migrations, README with setup steps.
>
> ### Tech Stack (must use)
> - Next.js 14 App Router · TypeScript · React 18
> - Tailwind is **not** required — keep `styles.css` (CSS variables) as-is and import it from `app/layout.tsx`
> - Prisma ORM · `@vercel/postgres`
> - NextAuth.js v5 (beta) with Google provider, Prisma adapter, JWT sessions
> - Recharts for `<ScoreChart>` and `<DiffDistribution>`
> - Google AdSense (`<Script src="https://pagead2.googlesyndication.com/...">`) + `<ins class="adsbygoogle">` units
> - Zod for API request validation
> - Vitest for unit tests on score-aggregation utilities
>
> ### Project Structure
> ```
> /app
>   /api
>     /auth/[...nextauth]/route.ts      # NextAuth handler
>     /scores/route.ts                  # POST submit, GET list
>     /leaderboards/route.ts            # GET ?period=today|weekly|monthly|alltime&difficulty=
>     /me/route.ts                      # GET current user stats
>     /users/[id]/route.ts              # GET public profile
>   /(public)
>     /play/page.tsx                    # game screen (anon + auth)
>     /leaderboards/page.tsx
>     /u/[id]/page.tsx                  # public profile
>   /(auth)
>     /dashboard/page.tsx
>     /profile/page.tsx
>   /layout.tsx
>   /globals.css                        # imports the existing styles.css
> /components
>   Game.tsx               # wraps the existing canvas engine, client component
>   GameOverCard.tsx
>   DifficultyPicker.tsx
>   LeaderboardTable.tsx
>   ScoreChart.tsx         # Recharts version, identical visual
>   DiffDistribution.tsx
>   Avatar.tsx, Tag.tsx, Toggle.tsx, Stat.tsx
>   AdSlot.tsx             # renders <ins class="adsbygoogle"> with the 6 size variants
>   SignInButton.tsx
>   TopBar.tsx, Footer.tsx
> /lib
>   engine.ts              # ported from engine.js, typed
>   prisma.ts              # singleton client
>   auth.ts                # NextAuth config
>   scores.ts              # aggregation queries (top-N, period filters, my-stats)
>   badges.ts              # badge threshold rules + check-on-save
>   adsense.ts             # constants for slot IDs
> /prisma
>   schema.prisma
> /public
>   /sounds (optional)
> ```
>
> ### Database Schema (Prisma)
> ```prisma
> model User {
>   id            String    @id @default(cuid())
>   email         String    @unique
>   name          String?
>   image         String?
>   avatarHue     Int       @default(200)
>   createdAt     DateTime  @default(now())
>   accounts      Account[]
>   sessions      Session[]
>   scores        Score[]
>   badges        UserBadge[]
> }
> model Account { /* NextAuth standard */ }
> model Session { /* NextAuth standard */ }
> model VerificationToken { /* NextAuth standard */ }
>
> model Score {
>   id          String   @id @default(cuid())
>   userId      String
>   user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
>   score       Int
>   difficulty  Difficulty
>   durationMs  Int
>   createdAt   DateTime @default(now())
>   @@index([createdAt])
>   @@index([difficulty, score(sort: Desc)])
>   @@index([userId, createdAt])
> }
>
> enum Difficulty { EASY NORMAL HARD INSANE }
>
> model Badge {
>   id          String   @id              // e.g. "first_flight"
>   name        String
>   description String
>   glyph       String
>   threshold   Int                       // score required, or 0 for special
>   category    String                    // "score" | "streak" | "rank" | "time"
>   userBadges  UserBadge[]
> }
> model UserBadge {
>   userId   String
>   badgeId  String
>   earnedAt DateTime @default(now())
>   user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
>   badge Badge @relation(fields: [badgeId], references: [id])
>   @@id([userId, badgeId])
> }
> ```
> Seed the `Badge` table with the 10 badges defined in `data.js` (`BADGES` array) on first migration.
>
> ### API Contracts
> - `POST /api/scores` — auth required. Body: `{ score: number, difficulty: 'easy'|'normal'|'hard'|'insane', durationMs: number }`. Validate with Zod, sanity-check (score ≥ 0, durationMs reasonable for the score: roughly `score * 1000` ± slack, reject impossible values). After insert, run `checkAndAwardBadges(userId)` and return `{ score, newBadges: Badge[] }`.
> - `GET /api/leaderboards?period=today|weekly|monthly|alltime&difficulty=all|easy|normal|hard|insane&limit=50` — public. Use SQL date filtering on `createdAt`. Return rows with `{ rank, userId, name, image, avatarHue, score, difficulty, durationMs, createdAt }`.
> - `GET /api/me` — auth required. Returns `{ user, bestScore, totalGames, totalPipes, avgScore, globalRank, history: Score[30], badges: Badge[] }`.
> - `GET /api/users/[id]` — public. Returns same shape minus email.
>
> ### Anonymous vs Authenticated
> - Anonymous play works fully — game state lives in client memory only. After every game-over the existing "Sign in to save?" prompt stays.
> - Authenticated play: after game-over, fire `POST /api/scores` and show "Saved ✓" plus any newly-earned badges as a toast.
> - Persist anonymous best score in `localStorage` so the user sees their session high.
>
> ### Game engine port
> - Move `engine.js` → `lib/engine.ts`, type all exports. Keep the difficulty config exactly. Keep WebAudio sound synth (no asset files needed).
> - `<Game>` component is `"use client"`, mounts the canvas, exposes the same callbacks (`onScore`, `onGameOver`).
> - Run at 60 FPS via `requestAnimationFrame`. Do not use a fixed timestep refactor — the prototype's loop is correct.
>
> ### AdSense
> - Add the AdSense loader script in `app/layout.tsx` with `next/script` strategy `afterInteractive`. Read `NEXT_PUBLIC_ADSENSE_CLIENT` from env.
> - `<AdSlot kind="leaderboard|rectangle|skyscraper|native|interstitial|banner-mobile" slotId="..." />` renders an `<ins class="adsbygoogle">` with the matching `data-ad-format` and dimensions, then calls `(adsbygoogle = window.adsbygoogle || []).push({})` in a `useEffect`.
> - Each slot ID comes from env (`NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD`, etc.) — list all six in `.env.example`.
> - Keep the "Advertisement" label visible above each unit (AdSense policy compliance).
> - Do **not** show ads on the game canvas itself or inside the game-over modal until the user has seen the score for ≥1 second (use a small delay to avoid accidental clicks — AdSense policy).
>
> ### Environment Variables (.env.example)
> ```
> DATABASE_URL=
> POSTGRES_PRISMA_URL=
> POSTGRES_URL_NON_POOLING=
> NEXTAUTH_URL=http://localhost:3000
> NEXTAUTH_SECRET=
> GOOGLE_CLIENT_ID=
> GOOGLE_CLIENT_SECRET=
> NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
> NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=
> NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=
> NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER=
> NEXT_PUBLIC_ADSENSE_SLOT_NATIVE=
> NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=
> NEXT_PUBLIC_ADSENSE_SLOT_BANNER_MOBILE=
> ```
>
> ### Anti-cheat (basic)
> - Server-side rate limit: max 1 score submission per 3 seconds per user (use Vercel KV or in-memory leaky bucket).
> - Reject scores where `durationMs / score` is outside the plausible range for that difficulty (use the `pipeSpeed` and `spawnDist` from the engine config to compute min ms-per-pipe).
> - Log suspicious submissions to a `flagged_scores` table for manual review (do not auto-delete).
>
> ### Tests
> - `lib/scores.test.ts` — leaderboard period filter math, rank computation.
> - `lib/badges.test.ts` — each badge rule, idempotency (don't double-award).
> - `app/api/scores/route.test.ts` — Zod validation, anti-cheat thresholds, auth gating.
>
> ### README must include
> 1. `pnpm install`, `pnpm prisma migrate dev`, `pnpm prisma db seed`, `pnpm dev`
> 2. Vercel deploy steps: link Postgres, set env vars, run migration in CI
> 3. How to get Google OAuth credentials (Cloud Console → OAuth 2.0 Client → callback `https://yourdomain/api/auth/callback/google`)
> 4. How to get AdSense client ID and create the 6 ad units in the AdSense dashboard
> 5. Local dev tip: AdSense will not render in localhost; use the `<AdSlot>` placeholder fallback in dev
>
> ### Acceptance criteria
> - `pnpm dev` runs the game, anonymous mode plays end-to-end without auth.
> - Sign in with Google → play → score appears in dashboard, leaderboard, and profile within one page refresh.
> - All 6 AdSense placements render in production build with the correct sizes (use placeholder boxes in dev).
> - Lighthouse Performance ≥ 90 on the game page (canvas is the heavy part — keep React tree thin).
> - `vercel deploy --prod` works on a fresh Vercel project after env vars + Postgres are linked.
>
> Please scaffold the repo, then implement in this order: **Prisma schema + migration → NextAuth → API routes → port engine → port screens → AdSense integration → tests → README**. Pause and ask if you hit ambiguity in the spec; do not invent new design or features.

---

## Files to keep handy when you paste this prompt

Have these open in Claude Code's context so it can match the prototype 1:1:

- `Sky Dodger.html` — entry, ad placement layout, font imports
- `styles.css` — all design tokens (colors, type, spacing, radii, shadows)
- `engine.js` — game engine + difficulty config (port to TS verbatim)
- `data.js` — `BADGES` array (seed source), data shapes for `Score`, `User`
- `components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx` — component layout, copy, ad slot positions

## Tips

- Tell Claude Code: **"Match the prototype's pixel layout. If you find yourself redesigning, stop and ask."**
- After scaffolding, run `pnpm prisma studio` to visually confirm the schema before building API routes.
- For the score-progression chart, use Recharts `<AreaChart>` with the same coral gradient — pass `stroke="oklch(0.55 0.18 32)"` and the existing area gradient stops.
- Keep canvas rendering inside a single `<Game>` client component so the rest of the app can stay server-rendered for SEO and AdSense crawl quality.
