-- >>> RUN THIS LAST. <<<
--
-- This is the migration that actually closes the hole: until it runs, the anon
-- key sitting in the JS bundle can still read and write everything, Cloudflare
-- or no Cloudflare.
--
-- PRECONDITIONS — verify all three before running:
--   1. 001_people.sql has been run.
--   2. The app is deployed with proxy.ts and /api/session, and SUPABASE_JWT_SECRET
--      is set in Vercel. Open the live site and confirm you can still edit a task.
--   3. `curl` the REST endpoint with only the anon key and see rows come back.
--      After this migration the same call must return [].
--
-- If the dashboard breaks, the rollback is at the bottom of this file.

alter table games enable row level security;
alter table tasks enable row level security;
alter table team_settings enable row level security;

drop policy if exists "public games" on games;
create policy "authenticated games" on games
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public tasks" on tasks;
create policy "authenticated tasks" on tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- team_settings was created outside this repo; adjust the dropped policy name
-- if yours differs (\dp team_settings will show it).
drop policy if exists "public team_settings" on team_settings;
create policy "authenticated team_settings" on team_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- ROLLBACK — re-opens access to the anon key. Paste into the SQL editor if the
-- live dashboard stops working and you need it back immediately.
--
--   drop policy if exists "authenticated games" on games;
--   create policy "public games" on games for all using (true) with check (true);
--   drop policy if exists "authenticated tasks" on tasks;
--   create policy "public tasks" on tasks for all using (true) with check (true);
--   drop policy if exists "authenticated team_settings" on team_settings;
--   create policy "public team_settings" on team_settings for all using (true) with check (true);
-- ---------------------------------------------------------------------------
