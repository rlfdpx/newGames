-- Identity table for Cloudflare Access sign-in.
--
-- ADDITIVE ONLY. Safe to run against the live database while the current
-- deployment is serving traffic: nothing here touches games, tasks, or
-- team_settings, and no existing row is rewritten.
--
-- `aliases` is what makes this work without a data migration. Task rows keep
-- their free-text assignee values ('Emeka', 'Emmeka', 'Ralph'), and a person
-- claims all the spellings that belong to them. "My Tasks" matches on
-- display_name OR any alias.

create table if not exists people (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  display_name  text not null,
  aliases       text[] not null default '{}',
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Case-insensitive lookup by email; Access hands us whatever case Google has.
create unique index if not exists people_email_lower_idx on people (lower(email));

-- set_updated_at() already exists in the live database (schema.sql defines it),
-- but this file has to stand alone, so redefine it idempotently first.
-- `create or replace` on an identical body is a no-op for the existing triggers.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_updated_at on people;
create trigger people_updated_at
  before update on people
  for each row execute function set_updated_at();

alter table people enable row level security;

-- Signed-in users can see the roster (needed for the assignee picker).
-- Writes go through /api/session with the service-role key, which bypasses RLS,
-- so no insert/update policy is granted to clients.
drop policy if exists "people readable by authenticated" on people;
create policy "people readable by authenticated" on people
  for select using (auth.role() = 'authenticated');
