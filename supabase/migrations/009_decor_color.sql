-- Color variant for decor items (plants, coffee cup, candle, clock).

alter table shelf_decor     add column if not exists decor_color text not null default 'cream';
alter table inventory_items add column if not exists decor_color text;
