-- Monster appearance preferences (body color + hat)

alter table users add column if not exists monster_color text default 'green';
alter table users add column if not exists monster_hat text default 'none';
