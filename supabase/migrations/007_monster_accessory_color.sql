-- Accessory color for monster face customization.

alter table monsters add column if not exists accessory_color_key text not null default 'red';
