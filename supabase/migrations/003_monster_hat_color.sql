-- Hat accent color (primary for most hats, band color for straw + top hat)

alter table users add column if not exists monster_hat_color text default 'red';
