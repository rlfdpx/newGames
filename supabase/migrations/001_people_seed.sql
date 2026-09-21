-- Seed the roster from the assignee names already in `tasks`.
--
-- >>> EDIT THIS FILE BEFORE RUNNING IT. <<<
-- Every email below is a placeholder. Replace each one with the person's real
-- work address (@lotomobil.com, @safitek.net, @numba.app, @aeglefinancials.com)
-- so it matches what Google hands Cloudflare Access at sign-in.
--
-- Running this is optional. Anyone who signs in without a row here is
-- auto-provisioned by /api/session — they just start with no aliases, so
-- "My Tasks" only matches tasks assigned under their exact display name.
-- Seeding is what connects people to the history already in the database.
--
-- Live assignee values and their task counts, as of 2026-09-20:
--   Kachi 51 · Emmy 47 · Emmeka 41 · Wesly Seide 18 · Joseph Alexandre 17
--   Emeka 16 · Lines St Jean 15 · Lens Jean Baptiste 10 · Ralph 10
--   Ralph Dupoux 7 · Dieury Zamor 6 · Benjamin 11 · Anita 2 · Romel 1
--   (24 tasks have no assignee)

insert into people (email, display_name, aliases) values
  ('ralph@example.com',   'Ralph Dupoux',        array['Ralph']),
  ('wesly@example.com',   'Wesly Seide',         array[]::text[]),
  ('lens@example.com',    'Lens Jean Baptiste',  array[]::text[]),
  ('joseph@example.com',  'Joseph Alexandre',    array[]::text[]),
  ('lines@example.com',   'Lines St Jean',       array[]::text[]),
  ('dieury@example.com',  'Dieury Zamor',        array[]::text[]),
  ('kachi@example.com',   'Kachi',               array[]::text[]),
  ('benjamin@example.com','Benjamin',            array[]::text[]),
  ('anita@example.com',   'Anita',               array[]::text[]),
  ('romel@example.com',   'Romel',               array[]::text[]),

  -- 'Emeka', 'Emmeka' and 'Emaka' are one name spelled three ways.
  -- 'Emmy' is a different person (Blessing) — confirmed 2026-09-21, kept separate.
  ('emeka@example.com',   'Emeka',               array['Emmeka','Emaka']),
  ('emmy@example.com',    'Emmy',                array[]::text[])

on conflict (email) do nothing;

-- Alias fixes for a roster that already exists. Safe to re-run; this is how to
-- claim a spelling that shows up in tasks after the initial seed.
update people set aliases = array['Emmeka','Emaka'] where display_name = 'Emeka';
update people set aliases = array['Ralph']          where display_name = 'Ralph Dupoux';

-- Find any assignee spelling nobody has claimed yet:
--
--   select t.assignee, count(*)
--   from tasks t
--   where t.assignee is not null
--     and not exists (
--       select 1 from people p
--       where lower(p.display_name) = lower(trim(t.assignee))
--          or lower(trim(t.assignee)) = any (select lower(unnest(p.aliases)))
--     )
--   group by 1 order by 2 desc;
