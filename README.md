# Games Launch Tracker HT

A live dashboard for tracking the launch status of a portfolio of games — per-game
metadata (status, release date, notes) and a per-game task board (category, status,
assignee, priority, dates, notes), with a portfolio-wide summary and filters.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19
- [Supabase](https://supabase.com) (Postgres + Realtime) as the backing store, accessed
  directly from the client via `@supabase/supabase-js` — no API layer
- [Tailwind CSS](https://tailwindcss.com) 4
- Styled with an internal "Nothing" design system (`var(--nd-*)` CSS custom properties
  in `app/globals.css`, Space Grotesk / Space Mono / Doto fonts via `next/font/google`)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the schema.** Open the SQL editor in your Supabase project and run the
   contents of [`supabase/schema.sql`](./supabase/schema.sql). This creates the
   `games` and `tasks` tables, `updated_at` triggers, and open RLS policies (see
   "Known limitations" below).

   The schema also adds `games` and `tasks` to the `supabase_realtime` publication
   (in an idempotent `do $$ ... $$` block), which is required for the live
   `postgres_changes` subscriptions in `lib/useGames.ts` to fire. If you're applying
   the schema in pieces rather than running the whole file at once, make sure that
   block gets run too.

3. **Set environment variables.** Create a `.env.local` file in the project root
   with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   `SUPABASE_SERVICE_ROLE_KEY` is only needed if you run `scripts/seed.ts` (see
   below) — it's not read by the app itself.

4. **Install dependencies and run the dev server:**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run a production build
- `npm run lint` — ESLint
- `scripts/seed.ts` — a one-off import script that pulls portfolio and per-game task
  data out of a Google Sheet (via its public CSV export) and loads it into Supabase.
  Not part of the app's runtime; only useful for the original data migration or a
  full re-seed. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. Run with
  `npx tsx scripts/seed.ts`.

## Known limitations

- **No authentication.** The app has no login/session layer; anyone with the URL can
  view and edit all data.
- **RLS is open.** `supabase/schema.sql` enables row-level security but adds
  permissive "allow all" policies for the anon key, effectively leaving the tables
  world-writable. This was a deliberate placeholder for early development — locking
  this down (real auth + scoped policies) is a pending decision, not yet implemented.
