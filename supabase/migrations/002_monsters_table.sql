-- Dedicated monster styling table (one row per user).
-- Safe to re-run on existing projects.

create table if not exists monsters (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references users(id) on delete cascade,
  color_key     text not null default 'green',
  hat_key       text not null default 'none',
  hat_color_key text not null default 'red',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists monsters_user_id_idx on monsters(user_id);

-- Backfill from legacy users.* columns when present.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'monster_color'
  ) then
    insert into monsters (user_id, color_key, hat_key, hat_color_key)
    select
      id,
      coalesce(monster_color, 'green'),
      coalesce(monster_hat, 'none'),
      coalesce(monster_hat_color, 'red')
    from users
    on conflict (user_id) do update set
      color_key = excluded.color_key,
      hat_key = excluded.hat_key,
      hat_color_key = excluded.hat_color_key,
      updated_at = now();
  else
    insert into monsters (user_id)
    select id from users
    on conflict (user_id) do nothing;
  end if;
end $$;

alter table users drop column if exists monster_color;
alter table users drop column if exists monster_hat;
alter table users drop column if exists monster_hat_color;

alter table monsters enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'monsters' and policyname = 'anon_all') then
    create policy anon_all on monsters for all using (true) with check (true);
  end if;
end $$;
