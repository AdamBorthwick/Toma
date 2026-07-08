-- Device identity: user uuid is persisted in browser localStorage.
-- last_ip is optional metadata only (updated when ipify is reachable).

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'ip'
  ) then
    alter table users drop constraint if exists users_ip_key;
    alter table users rename column ip to last_ip;
  end if;
end $$;

alter table users alter column last_ip drop not null;
