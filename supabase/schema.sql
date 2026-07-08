create table if not exists games (
  id             uuid primary key default gen_random_uuid(),
  game_name      text not null,
  code_name      text,
  overall_status text not null default 'In Development',
  release_date   date,
  notes          text,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  category    text not null,
  name        text not null,
  status      text not null default 'Not Started',
  assignee    text,
  start_date  date,
  end_date    date,
  priority    text,
  notes       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_game_id_idx on tasks(game_id);

-- updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_updated_at on games;
create trigger games_updated_at
  before update on games
  for each row execute function set_updated_at();

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Open RLS (anon key can do everything)
alter table games enable row level security;
alter table tasks enable row level security;

drop policy if exists "public games" on games;
create policy "public games" on games for all using (true) with check (true);

drop policy if exists "public tasks" on tasks;
create policy "public tasks" on tasks for all using (true) with check (true);
