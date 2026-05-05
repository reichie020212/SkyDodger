# Sky Dodger

A Flappy-Bird-style web game with persistent leaderboards, badges, and four
difficulty modes. Built on Next.js 14 (App Router), TypeScript, Prisma +
Vercel Postgres, NextAuth v5 (Google OAuth), Recharts, and Google AdSense.

The HTML/React prototype the production app is ported from lives in
[`legacy/`](./legacy/) and is the canonical visual reference. The
implementation brief is [`CLAUDE_CODE_PROMPT.md`](./CLAUDE_CODE_PROMPT.md);
the per-phase execution plan is [`BLUEPRINT.md`](./BLUEPRINT.md).

## Quickstart

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
cp .env.example .env.local           # fill in values — see below
pnpm prisma migrate dev --name init  # creates the database schema
pnpm prisma db seed                  # populates the 10 badge rows
pnpm dev                             # http://localhost:3000
```

Anonymous play works without any database, OAuth, or AdSense setup — the
game runs from `localStorage` for session-best, ads render as placeholders
when slot IDs are missing, and `auth()` returns `null`. To exercise
sign-in or score persistence you need at least the database and Google
OAuth credentials.

### Useful scripts

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Next.js dev server (HMR on)                       |
| `pnpm build`       | Production build (typecheck + lint + bundle)      |
| `pnpm start`       | Run the production build                          |
| `pnpm lint`        | ESLint (Next.js config)                           |
| `pnpm test`        | Vitest one-shot                                   |
| `pnpm test:watch`  | Vitest watch mode                                 |
| `pnpm db:generate` | Regenerate the Prisma client                      |
| `pnpm db:migrate`  | Run / create migrations against the dev database  |
| `pnpm db:seed`     | Run `prisma/seed.ts` to populate static tables    |
| `pnpm db:studio`   | Open Prisma Studio                                |

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill in the
values you need.

### Database

Vercel Postgres injects `POSTGRES_PRISMA_URL` (pooled, pgbouncer) and
`POSTGRES_URL_NON_POOLING` (direct, used by `prisma migrate`). Locally,
point both at the same connection string (Docker, Postgres.app, etc.):

```env
POSTGRES_PRISMA_URL=postgres://user:pass@localhost:5432/skydodger
POSTGRES_URL_NON_POOLING=postgres://user:pass@localhost:5432/skydodger
DATABASE_URL=postgres://user:pass@localhost:5432/skydodger
```

### Google OAuth (NextAuth v5)

1. [Google Cloud Console → APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) — set up an app, scope `openid profile email`.
2. [Credentials → Create credentials → OAuth client ID](https://console.cloud.google.com/apis/credentials) — application type **Web application**.
3. Add an authorized redirect URI:
   - **Local:** `http://localhost:3000/api/auth/callback/google`
   - **Prod:** `https://yourdomain.com/api/auth/callback/google`
4. Copy the client ID and secret into `.env.local`:
   ```env
   AUTH_SECRET=<generate with: openssl rand -base64 32>
   AUTH_GOOGLE_ID=...apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   ```

The app uses the v5-native env var names. Legacy `NEXTAUTH_*` /
`GOOGLE_*` are still readable, but standardize on the v5 names.

### Google AdSense

AdSense will not render in `localhost`; the `<AdSlot>` component
falls back to a labeled placeholder box whenever the client ID or
slot ID is missing, so layouts stay readable in dev.

When you have an AdSense account:

1. AdSense → Ads → By ad unit → Create six display units sized to
   match the placements:
   - Leaderboard (728×90)
   - Rectangle (300×250)
   - Skyscraper (160×600)
   - Native fluid
   - Interstitial (300×250)
   - Banner Mobile (320×100)
2. Copy each slot ID and the publisher client ID into `.env.local`:
   ```env
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
   NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=...
   NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=...
   NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER=...
   NEXT_PUBLIC_ADSENSE_SLOT_NATIVE=...
   NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=...
   NEXT_PUBLIC_ADSENSE_SLOT_BANNER_MOBILE=...
   ```

The loader script is conditionally injected from `app/layout.tsx` only
when `NEXT_PUBLIC_ADSENSE_CLIENT` is set, so dev builds stay quiet.
The game-over interstitial is gated by a 1-second delay (AdSense policy
guard against accidental clicks).

## Deploying to Vercel

1. Push the repo to GitHub and import it in the Vercel dashboard.
2. **Storage → Create → Postgres** — Vercel auto-injects
   `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, and
   `DATABASE_URL` into the project's env.
3. Add the NextAuth + AdSense env vars from the sections above.
4. The default `installCommand` runs `pnpm install && npx prisma
   generate` (configured in [`vercel.json`](./vercel.json)) so the
   Prisma client is built before the Next.js bundle.
5. Run the migration once against the prod DB:
   ```bash
   POSTGRES_URL_NON_POOLING=<copy from Vercel> pnpm prisma migrate deploy
   POSTGRES_URL_NON_POOLING=<copy from Vercel> pnpm prisma db seed
   ```
6. `vercel deploy --prod` (or push to `main`).

## Architecture notes

- `lib/engine.ts` — typed port of the prototype's canvas engine; difficulty
  values must stay in sync with `lib/anti-cheat.ts`'s `MIN_MS_PER_PIPE`
  table. Don't tune one without the other.
- `lib/scores.ts` — period filters, leaderboard query, user stats and
  global rank.
- `lib/badges.ts` — per-badge rule map + `checkAndAwardBadges(userId)`,
  called after every score insert.
- `lib/rate-limit.ts` — in-memory leaky bucket per user (3s cooldown).
  Imperfect across serverless cold starts; the duration plausibility
  check is the real defense. Revisit Vercel KV if abuse appears.
- `lib/anti-cheat.ts` — rejects score submissions whose `durationMs`
  is below 90% of `score × MIN_MS_PER_PIPE[difficulty]`.
- `app/(auth)/layout.tsx` — auth-gates `/dashboard` and `/profile`,
  redirects unsigned users to `/play`.
- `legacy/` — the immutable design reference. Don't import from it; the
  live stylesheet is `app/sky-dodger.css`.
