-- Eye color and face accessories for monster customization.

alter table monsters add column if not exists eye_color_key text not null default 'dark';
alter table monsters add column if not exists accessory_key text not null default 'none';
