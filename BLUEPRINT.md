# Sky Dodger Implementation Blueprint

> Architect: Gemini · Executor: Claude Code · Owner: Red
> Source brief: [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md)
> Workflow rules: [`CLAUDE.md`](./CLAUDE.md), [`GEMINI.md`](./GEMINI.md)

## 0. Scaffold
- **Invocation:** `pnpm create next-app . --typescript --eslint --no-tailwind --no-src-dir --app --import-alias "@/*"`
- **Post-scaffold cleanup:**
  - Delete `app/page.tsx`, `app/favicon.ico`, `public/next.svg`, `public/vercel.svg`.
  - Keep `app/layout.tsx` and `app/globals.css`.
- **Legacy Files:** Move all prototype files (`Sky Dodger.html`, `engine.js`, `data.js`, `components.jsx`, `game-screen.jsx`, `screens.jsx`, `app.jsx`) to a new `/legacy` directory. **Rationale:** Root remains clean for Next.js convention; `/legacy` serves as the 1:1 reference for the porting process.
- **Styling:** Import `styles.css` directly in `app/layout.tsx` before `globals.css`. Ensure `globals.css` is empty or only contains minimal resets to avoid overriding prototype tokens.
- **Verification:** `pnpm dev` boots a blank page with prototype colors (e.g., `background-color: var(--bg-deep)`) applied via CSS classes in `layout.tsx`.

## 1. Phase 1 — Prisma + DB
- **Files to create:** `prisma/schema.prisma`, `prisma/seed.ts`, `lib/prisma.ts`.
- **Schema Confirmation:** Use the schema from `CLAUDE_CODE_PROMPT.md`. No changes requested.
- **Badge Seeding (data.js → Badge table):**

  | Badge ID | Threshold | Category | Logic |
  | :--- | :--- | :--- | :--- |
  | `first_flight` | 1 | `score` | score >= 1 |
  | `ten_pipes` | 10 | `score` | score >= 10 |
  | `fifty_pipes` | 50 | `score` | score >= 50 |
  | `hundred_pipes` | 100 | `score` | score >= 100 |
  | `hard_mode` | 25 | `difficulty` | difficulty=HARD, score >= 25 |
  | `insane_mode` | 15 | `difficulty` | difficulty=INSANE, score >= 15 |
  | `streak_7` | 7 | `streak` | 7 consecutive days played |
  | `top_100` | 100 | `rank` | Global rank <= 100 |
  | `top_10` | 10 | `rank` | Global rank <= 10 |
  | `night_owl` | 0 | `time` | Played between 00:00 - 05:00 |

- **Exact commands:**
  ```bash
  pnpm add prisma @prisma/client @vercel/postgres
  npx prisma migrate dev --name init
  npx prisma db seed
  ```
- **Verification:** `pnpm prisma studio` shows 10 badges and a clean `User` table.

## 2. Phase 2 — NextAuth v5 + Google
- **lib/auth.ts:**
  - `PrismaAdapter(prisma)`, `providers: [Google]`, `session: { strategy: 'jwt' }`.
  - Callbacks: `jwt` to include `id` and `avatarHue`; `session` to pass them to client.
- **Handler:** `export { GET, POST } from "@/lib/auth"`.
- **Env checklist:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL`.
- **Google Console:**
  - Redirect URI: `http://localhost:3000/api/auth/callback/google`.
  - Scopes: `openid`, `profile`, `email`.
- **v5 Gotchas:** Use `auth()` for server components; wrap Client components in `SessionProvider`. Avoid `Edge` runtime for the auth handler if using standard Prisma (use `PrismaPostgres` adapter if Edge is required).
- **Verification:** Auth flow completes; `User` row has a random `avatarHue` (0-360) on creation.

## 3. Phase 3 — API routes
- **Anti-Cheat Math (derived from engine.js):**
  - Min Ms-per-pipe: `EASY: 2117ms`, `NORMAL: 1483ms`, `HARD: 1083ms`, `INSANE: 766ms`.
  - **Rejection Rule:** `durationMs < (score * minMsPerPipe * 0.9)` (10% slack).
- **Routes:**
  - `/api/scores`: `POST` (Auth required). Zod: `{ score: z.number().min(0), difficulty: z.enum(['EASY', 'NORMAL', 'HARD', 'INSANE']), durationMs: z.number().min(0) }`.
  - `/api/leaderboards`: `GET` (Public). Period filter: `createdAt: { gte: new Date(Date.now() - PERIOD_MS[period]) }`.
  - `/api/me`: `GET` (Auth required). Rank: `prisma.score.count({ where: { score: { gt: userBest } } }) + 1`.
  - `/api/users/[id]`: `GET` (Public). Aggregates via `prisma.score.aggregate`.
- **Rate Limit:** In-memory leaky bucket (simple object storage) keyed by `userId` / `IP`. (See open questions — Vercel KV may be preferred.)
- **Verification:** `curl -X POST -d '{"score": 999, "durationMs": 10}' ...` returns `422 Unprocessable Entity`.

## 4. Phase 4 — Port engine
- **lib/engine.ts:**
  - Exports: `createGame(canvas, opts)`, `DIFFICULTY` (as const).
  - Types: `GameInstance`, `GameConfig`, `GameState`, `ScoreData`.
- **Typing:** `AudioContext` and `OscillatorNode` wrapped in `if (typeof window !== 'undefined')`.
- **components/Game.tsx:**
  - `useRef<HTMLCanvasElement>` + `useRef<GameInstance>`.
  - `useEffect` handles resize listener and `engine.start()`.
  - `onScore` and `onGameOver` props bridge Canvas → React.
- **Verification:** Game playable at `/play` with functional sound synth.

## 5. Phase 5 — Port screens

| Prototype | Target | Group |
| :--- | :--- | :--- |
| `app.jsx` (Home) | `app/(public)/page.tsx` | `(public)` |
| `game-screen.jsx` | `app/(public)/play/page.tsx` | `(public)` |
| `screens.jsx` (L'board) | `app/(public)/leaderboards/page.tsx` | `(public)` |
| `screens.jsx` (Dash) | `app/(auth)/dashboard/page.tsx` | `(auth)` |
| `screens.jsx` (Profile) | `app/(auth)/profile/page.tsx` | `(auth)` |
| `screens.jsx` (User) | `app/(public)/u/[id]/page.tsx` | `(public)` |

- **TSX Gotchas:** Replace `class` with `className`. Use `next/font/google` for 'Space Grotesk'. Use `next/image` for avatars.
- **Layout:** `TopBar` and `Footer` in `app/layout.tsx`. Use a `usePathname()` hook to hide them during active gameplay if `pathname === '/play'`.

## 6. Phase 6 — AdSense
- **Ad Units:**

  | Kind | Format | Dimensions |
  | :--- | :--- | :--- |
  | `leaderboard` | `horizontal` | 728x90 |
  | `rectangle` | `rectangle` | 300x250 |
  | `skyscraper` | `vertical` | 160x600 |
  | `native` | `fluid` | Auto |
  | `interstitial` | `rectangle` | 300x250 |
  | `banner-mobile` | `horizontal` | 320x50 |

- **Dev Fallback:** `if (process.env.NODE_ENV === 'development') return <div className="ad-debug">{kind}</div>`. Keep the "Advertisement" label visible above the placeholder for parity with prod (AdSense policy).
- **Interstitial logic:**
  ```tsx
  useEffect(() => {
    if (showGameOver) {
      const timer = setTimeout(() => setLoadAd(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showGameOver]);
  ```
- **Verification:** Dev mode shows boxes with "Advertisement" label (per prototype CSS).

## 7. Phase 7 — Tests
- **vitest.config.ts:** `environment: 'jsdom'`. `pnpm add -D vitest @vitejs/plugin-react jsdom`.
- **Suites:**
  - `lib/scores.test.ts`: Test `getRank()` and `getPeriodDate()`.
  - `lib/badges.test.ts`: Verify `awardBadges()` returns only new badges.
  - `api/scores/route.test.ts`: Mock `auth()` and test `score/duration` rejection edge cases.
- **Verification:** `pnpm test` output is all green.

## 8. Phase 8 — README + Vercel deploy
- **README:** Setup `GOOGLE_CLIENT_ID`, `DATABASE_URL`, and all 6 `ADSENSE_SLOT_` IDs.
- **vercel.json:**
  ```json
  { "installCommand": "pnpm install && npx prisma generate" }
  ```
- **Verification:** Deployment URL shows the game; Google login works in production.

## Technical Gotchas
- **Canvas DPR.** `engine.js` already handles `devicePixelRatio` scaling; make sure the `Game.tsx` container's CSS doesn't double-scale it.
- **Hydration.** `Game` mounts canvas + `AudioContext` — must be a client component, and the `<canvas>` element must not be rendered on the server (guard with a `mounted` state if needed).
- **Server Actions vs API.** Score submission stays an API route (per spec). Profile updates can be Server Actions for ergonomics.
- **NextAuth v5 helper.** Use `auth()` in Server Components, `useSession()` in Client Components. `NEXTAUTH_URL` must be set in every environment.

## Decisions (locked by Red)

1. **`avatarHue`.** Randomized once at signup (`Math.floor(Math.random() * 360)`), **editable** by the user in the Profile screen.
2. **`night_owl` timezone.** Server-side **UTC**. Awarded if `createdAt` UTC hour is in `[0, 5)`. (If we later want user-local, add a `tzOffsetMin` field to the score-submission contract.)
3. **Rate limiter backend.** **In-memory leaky bucket** for MVP. Anti-cheat duration math is the real defense; serverless cold-starts make in-memory imperfect, but the cost of being bypassed by the 3s gate is bounded. Revisit Vercel KV if abuse appears.
4. **NextAuth env naming.** **v5-native** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. Update `.env.example` accordingly.

## Executor sanity-check notes (Claude)

- **Anti-cheat math verified** against `engine.js` (`spawnDist / pipeSpeed × 16.667ms` per pipe at 60fps): EASY 2121, NORMAL 1488, HARD 1078, INSANE 774. Within rounding of Gemini's 2117/1483/1083/766. ✅
- **Badge IDs verified** against `data.js` `BADGES` array — all 10 IDs match. The prototype's `threshold` predicates are mostly placeholders (`() => true`/`() => false`); real award rules will be implemented per the table above in `lib/badges.ts`. ✅
- **NextAuth env naming.** Gemini standardized on v5-native names (`AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) instead of the prompt's legacy `NEXTAUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. NextAuth v5 reads both; recommend going with v5-native and updating `.env.example` accordingly. (Surface for Red if preferred otherwise.)
