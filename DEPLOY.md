# Sky Dodger — Deployment Guide

Setup instructions for running Sky Dodger locally and shipping it to
production on Vercel. For project background, see
[`README.md`](./README.md); for the implementation plan, see
[`BLUEPRINT.md`](./BLUEPRINT.md).

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Local development](#2-local-development)
3. [Production deployment (Vercel)](#3-production-deployment-vercel)
4. [Google OAuth setup](#4-google-oauth-setup)
5. [Google AdSense setup](#5-google-adsense-setup)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

- **Node 20+** (the lockfile is generated on Node 25; anything 20+ should work)
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Postgres 14+** for the database (only required when you want score
  persistence — anonymous play does not need a DB)
- **Google Cloud account** for OAuth (production sign-in)
- **Google AdSense account** for ad serving (production only — dev
  shows placeholders)
- **Vercel account** for hosting

---

## 2. Local development

### 2.1 Fastest path: anonymous play, no setup

Anonymous play works without **any** external services — no DB, no
OAuth, no AdSense. Session-best persists in `localStorage`, ad slots
render as labeled placeholders.

```bash
pnpm install
echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env.local
pnpm dev
```

Open <http://localhost:3000>. The root path redirects to `/play`. Pick
a difficulty, click **Start flying**, dodge the slabs.

> Note: `/dashboard`, `/profile`, and `/u/[id]` will return server
> errors until you wire up Postgres (see the next section). `/play`
> and `/leaderboards` (empty list) work without a DB.

### 2.2 Full path: with database and OAuth

#### 2.2.1 Choose a Postgres option

| Option | Setup |
| ------ | ----- |
| **Docker (recommended)** | `docker compose up -d` — uses the included [`docker-compose.yml`](./docker-compose.yml), which spins up Postgres 16 with a persistent volume |
| **Docker (one-shot)** | `docker run --name sd-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16` |
| **Postgres.app** (macOS) | Install from <https://postgresapp.com>, then `createdb skydodger` |
| **Homebrew** (macOS) | `brew install postgresql@16 && brew services start postgresql@16 && createdb skydodger` |
| **Vercel Postgres (dev branch)** | Provision in the Vercel dashboard, copy the connection strings |

Whichever you pick, build a connection string of the form
`postgres://USER:PASS@HOST:PORT/DBNAME`.

#### 2.2.2 Configure `.env.local`

Copy the template and fill in:

```bash
cp .env.example .env.local
```

```env
# Same string in all three for local dev
DATABASE_URL=postgres://postgres:dev@localhost:5432/skydodger
POSTGRES_PRISMA_URL=postgres://postgres:dev@localhost:5432/skydodger
POSTGRES_URL_NON_POOLING=postgres://postgres:dev@localhost:5432/skydodger

# Generate with: openssl rand -base64 32
AUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3000

# Used to resolve absolute URLs for the OG / social card image
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# From the Google OAuth setup section below
AUTH_GOOGLE_ID=<client-id>.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=<client-secret>

# Optional in dev — leave blank to render ad placeholders
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=
NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=
NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER=
NEXT_PUBLIC_ADSENSE_SLOT_NATIVE=
NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=
NEXT_PUBLIC_ADSENSE_SLOT_BANNER_MOBILE=
```

#### 2.2.3 Initialize the database

```bash
pnpm prisma migrate dev --name init   # creates the schema
pnpm prisma db seed                   # populates the 10 badges
```

Verify:

```bash
pnpm prisma studio
# → opens http://localhost:5555, you should see 10 rows in the Badge table
```

#### 2.2.4 Run the dev server

```bash
pnpm dev
```

#### 2.2.5 Verify the full path

1. Open <http://localhost:3000> → redirected to `/play`.
2. Click **Sign in** in the top-right → consents via Google → redirects back.
3. The User row appears in `prisma studio` with a randomized `avatarHue`.
4. Play one round. On game-over the status should read **Saved ✓**.
5. Visit `/dashboard` — your run shows in the chart and recent runs.
6. Visit `/leaderboards` — your run is on the table.
7. Visit `/profile` — adjust the avatar hue slider; status reads **saved ✓**.

---

## 3. Production deployment (Vercel)

### 3.1 Push to GitHub

```bash
git push origin main
```

### 3.2 Import the project in Vercel

1. <https://vercel.com/new>
2. Pick the repo, framework auto-detects as **Next.js**.
3. Don't deploy yet — finish env config first.

### 3.3 Provision Vercel Postgres

1. In the project: **Storage → Create Database → Postgres**.
2. Pick the closest region.
3. **Connect Project** — Vercel auto-injects:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `DATABASE_URL`
   - …and a few others you can ignore.

### 3.4 Add the remaining env vars

In **Settings → Environment Variables**, add (Production + Preview):

```
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD=...
NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE=...
NEXT_PUBLIC_ADSENSE_SLOT_SKYSCRAPER=...
NEXT_PUBLIC_ADSENSE_SLOT_NATIVE=...
NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL=...
NEXT_PUBLIC_ADSENSE_SLOT_BANNER_MOBILE=...
```

### 3.5 Run the migration against prod (one-time)

Pull the prod env down and run a deploy migration:

```bash
vercel env pull .env.production.local --environment production

# Migrate
POSTGRES_PRISMA_URL="$(grep POSTGRES_PRISMA_URL .env.production.local | cut -d= -f2-)" \
POSTGRES_URL_NON_POOLING="$(grep POSTGRES_URL_NON_POOLING .env.production.local | cut -d= -f2-)" \
  pnpm prisma migrate deploy

# Seed badges
POSTGRES_PRISMA_URL="$(grep POSTGRES_PRISMA_URL .env.production.local | cut -d= -f2-)" \
POSTGRES_URL_NON_POOLING="$(grep POSTGRES_URL_NON_POOLING .env.production.local | cut -d= -f2-)" \
  pnpm prisma db seed
```

> Don't commit `.env.production.local` — it's gitignored.

### 3.6 Deploy

```bash
vercel deploy --prod
```

…or just push to `main`; Vercel auto-deploys.

### 3.7 Verify production

- `https://yourdomain.com/play` plays in anonymous mode.
- Sign in with Google → User row appears in Vercel Postgres.
- Game-over **Saved ✓** appears, score shows in `/leaderboards`.
- All six AdSlots render real `<ins class="adsbygoogle">` units (view
  source on a page that includes them; the units may be blank for a
  few minutes after AdSense crawl).

---

## 4. Google OAuth setup

1. <https://console.cloud.google.com> → create or pick a project.
2. **APIs & Services → OAuth consent screen** → **External** for public
   apps.
   - User type: External
   - App name: `Sky Dodger`
   - User support / developer contact email: yours
   - Scopes: `openid`, `userinfo.profile`, `userinfo.email`
   - Test users: while in **Testing** mode, add your email so you can
     sign in. Move to **Production** before launch.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Sky Dodger Web`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://yourdomain.com`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`
4. Copy the **Client ID** → `AUTH_GOOGLE_ID`.
5. Copy the **Client secret** → `AUTH_GOOGLE_SECRET`.

---

## 5. Google AdSense setup

> Skip this for dev — `<AdSlot>` falls back to placeholder boxes when
> `NEXT_PUBLIC_ADSENSE_CLIENT` or the per-kind slot ID is missing.

1. <https://www.google.com/adsense> → Sign up with the production
   domain. Wait for site approval (can take days).
2. Once approved, go to **Ads → By ad unit → Create ad unit** and
   create six display units:

   | Kind | Type | Size |
   | ---- | ---- | ---- |
   | leaderboard | Display | 728 × 90 (Horizontal) |
   | rectangle | Display | 300 × 250 (Rectangle) |
   | skyscraper | Display | 160 × 600 (Vertical) |
   | native | In-feed | Fluid (responsive) |
   | interstitial | Display | 300 × 250 (Rectangle) |
   | banner-mobile | Display | 320 × 100 (Horizontal, responsive) |

3. For each unit, copy the slot ID into the matching env var:
   - `NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD`, etc.

4. Copy your publisher ID (`ca-pub-xxxxxxxxxxxxxxxx`) into
   `NEXT_PUBLIC_ADSENSE_CLIENT`.

5. AdSense's `ads.txt` will be auto-served at
   `https://yourdomain.com/ads.txt` if you add it to `public/ads.txt`
   (not committed by default — copy from the AdSense dashboard).

---

## 6. Troubleshooting

### `pnpm dev` exits with `Error: P1001` (can't reach DB)

Postgres isn't running, or your `POSTGRES_PRISMA_URL` is wrong.
Anonymous play (`/play`) doesn't need the DB; only `/dashboard`,
`/profile`, and `/u/[id]` do. Verify your DB:

```bash
psql "$POSTGRES_PRISMA_URL" -c "select 1;"
```

### NextAuth sign-in fails with `Configuration` error

`AUTH_SECRET` is missing or empty. Generate one:

```bash
openssl rand -base64 32
```

…and put it in `.env.local`.

### Sign-in works but redirects to `/api/auth/error`

The Google OAuth redirect URI doesn't match what's registered in Cloud
Console. Check that the URI is **exactly**:

```
http://localhost:3000/api/auth/callback/google
```

(or the prod equivalent — note the trailing `/google`).

### `prisma migrate dev` errors with `database does not exist`

Postgres is up but the named database isn't. Create it:

```bash
psql -U postgres -c "CREATE DATABASE skydodger;"
```

### AdSense placeholders still show in production

Verify `NEXT_PUBLIC_ADSENSE_CLIENT` is set in the **Production** env
in Vercel (not just Preview/Development), then redeploy. Public env
vars are inlined at build time.

### Recharts and bundle size

`<ScoreChart>` is already wrapped in `next/dynamic` (see
`components/ScoreChart.tsx`), so Recharts only loads when a chart is
viewed. `/dashboard`, `/profile`, and `/u/[id]` are all under 100 kB
First Load JS. If a future change re-imports Recharts statically and
the bundle balloons, the fix is the same `dynamic(() => import(...),
{ ssr: false })` pattern.

### `prisma migrate deploy` against prod hangs

Vercel's Postgres pgbouncer URL doesn't accept DDL. Use
`POSTGRES_URL_NON_POOLING` for `migrate deploy`, not
`POSTGRES_PRISMA_URL`. The script in §3.5 uses both.
