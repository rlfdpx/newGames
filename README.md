# Games Launch Tracker

A live dashboard for tracking the launch status of a portfolio of games across
several teams — per-game metadata (status, release date, thumbnail, notes) and a
per-game task board (category, status, assignee, priority, dates, notes), with a
portfolio-wide summary, filters, and a cross-team "My Tasks" view for whoever is
signed in.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack) + React 19
- [Supabase](https://supabase.com) (Postgres + Realtime) as the backing store,
  queried from the client via `@supabase/supabase-js`
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
  (Zero Trust) for sign-in, with Google as the identity provider
- [Tailwind CSS](https://tailwindcss.com) 4
- Styled with an internal "Nothing" design system (`var(--nd-*)` custom properties
  in `app/globals.css`; Space Grotesk / Space Mono / Doto via `next/font/google`)

## How auth works

Access is enforced at two layers, because either one alone leaves a hole.

**1. The network edge.** Cloudflare Access sits in front of the app's hostname
and requires a Google sign-in from an allowlisted email domain. It stamps every
request that gets through with a signed JWT assertion.

**2. The app itself.** [`proxy.ts`](./proxy.ts) re-verifies that assertion
against Cloudflare's JWKS on every request. This is not redundant: Access
protects a *hostname*, so the app's bare `*.vercel.app` deployment URLs would
otherwise be wide open. Anything without a valid assertion gets a 403.

The proxy then rebuilds the `x-user-email` request header from the verified
token, discarding any copy the client sent — otherwise a request could simply
claim to be someone else.

**Why a third step is needed.** Neither layer protects Supabase, which the
browser talks to directly using a publishable key that ships in the JS bundle.
So [`app/api/session/route.ts`](./app/api/session/route.ts) exchanges the Access
identity for a short-lived (1h) Supabase JWT with `role: authenticated`, handed
to `supabase-js` through its `accessToken` option — which also carries it onto
the realtime socket. RLS then requires that role, so the publishable key alone
reads and writes nothing.

## Identity and "My Tasks"

`tasks.assignee` is free text typed by hand, and had drifted into several
spellings of the same person (`Emeka` / `Emmeka` / `Emaka`, `Ralph` /
`Ralph Dupoux`). Rather than rewrite historical rows, the `people` table carries
an `aliases` array: a person claims every spelling that belongs to them, and
`/my` matches on their display name or any alias.

People are auto-provisioned on first sign-in, so the table only needs seeding to
connect someone to task history that predates their first login.

## Setup

Full infrastructure walkthrough: [`docs/cloudflare-access-setup.md`](./docs/cloudflare-access-setup.md).
The short version:

1. **Create a Supabase project**, then run these in its SQL editor, in order:
   - [`supabase/schema.sql`](./supabase/schema.sql) — `games` and `tasks`,
     `updated_at` triggers, and the `supabase_realtime` publication block that
     the `postgres_changes` subscriptions in `lib/useGames.ts` depend on.
   - [`supabase/migrations/001_people.sql`](./supabase/migrations/001_people.sql) — the roster.
   - [`001_people_seed.sql`](./supabase/migrations/001_people_seed.sql) — optional;
     **replace the placeholder emails first.**
   - [`002_rls_authenticated.sql`](./supabase/migrations/002_rls_authenticated.sql) —
     **last.** This is the one that requires a signed-in user, so run it only once
     sign-in is confirmed working, or the dashboard goes dark for everyone.

2. **Set up Cloudflare Access** — a Cloudflare-proxied hostname pointing at the
   deployment, a Google login method, and an application policy allowlisting your
   email domains. See the setup doc; the ordering matters.

3. **Environment variables** (`.env.local` locally, Vercel for deploys):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
   SUPABASE_JWT_SECRET=...            # signs the session token
   CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
   CF_ACCESS_AUD=...                  # the Access application's audience tag
   ```

4. **Install and run:**

   ```bash
   npm install
   DEV_USER_EMAIL=you@your-domain.com npm run dev
   ```

   `DEV_USER_EMAIL` is required locally: there is no Cloudflare in front of
   `next dev`, so without it every route returns 403. It is ignored outside
   `NODE_ENV=development`.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint
- `scripts/seed.ts` — one-off importer that pulls portfolio and task data out of a
  Google Sheet (public CSV export) into Supabase. Not part of the runtime; only
  useful for the original migration or a full re-seed. Needs
  `SUPABASE_SERVICE_ROLE_KEY`. Run with `npx tsx scripts/seed.ts`.

## Known limitations

- **`schema.sql` has drifted from the live database.** `games.team`,
  `games.thumbnail_url`, the `team_settings` table, and the `game-thumbnails`
  storage bucket were added by hand and are not reflected in the file. A fresh
  project built from `schema.sql` alone will not match production.
- **Storage is not behind auth.** `002_rls_authenticated.sql` covers the tables;
  Supabase Storage has a separate policy system, so a public `game-thumbnails`
  bucket stays public.
- **Session tokens are signed with Supabase's legacy HS256 JWT secret**, which is
  deprecated. It still verifies, but disabling it would break sign-in. The
  migration path — ES256 plus Third-Party Auth — is written up in the setup doc.
- **No optimistic updates.** Every mutation refetches the full dataset, and the
  realtime subscription then triggers a second refetch.
- **No tests.** CI runs lint, `tsc`, and a production build only.
