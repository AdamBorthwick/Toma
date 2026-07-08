-- Sprout / TOMA schema
-- Run in the Supabase SQL editor or via `supabase db push`.

-- ── Users (IP-based identity for prototype; replace with Supabase Auth in production) ──

create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  ip         text unique not null,
  username   text,
  created_at timestamptz not null default now()
);

-- ── Books (shared catalog — keyed by Open Library work id or custom id) ───────────────

create table if not exists books (
  id              text primary key,
  title           text not null,
  author          text,
  spine           text,
  ink             text,
  cover_bg        text,
  cover_ink       text,
  thumbnail       text,
  year            int,
  h               int,
  w               int,
  blurb           text,
  category        text,
  first_sentence  text,
  subjects        text[],
  series          text
);

-- ── Bookshelves (one per user) ────────────────────────────────────────────────────────

create table if not exists bookshelves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references users(id) on delete cascade,
  share_id   text unique not null default encode(gen_random_bytes(6), 'hex'),
  name       text not null default 'My Shelf',
  updated_at timestamptz not null default now()
);

create index if not exists bookshelves_share_id_idx on bookshelves(share_id);

-- ── Shelf rows ────────────────────────────────────────────────────────────────────────

create table if not exists shelf_rows (
  id           uuid primary key default gen_random_uuid(),
  bookshelf_id uuid not null references bookshelves(id) on delete cascade,
  position     int not null,
  label        text not null,
  color_key    text not null,
  unique (bookshelf_id, position)
);

-- ── Shelf books (vertical books + horizontal stacks) ──────────────────────────────────

create table if not exists shelf_books (
  id           uuid primary key default gen_random_uuid(),
  shelf_row_id uuid not null references shelf_rows(id) on delete cascade,
  item_type    text not null check (item_type in ('vertical-book', 'horizontal-stack')),
  start_slot   int not null,
  slot_width   int not null,
  book_id      text references books(id) on delete set null
);

-- ── Stack books (books inside a horizontal-stack shelf_books row) ───────────────────

create table if not exists stack_books (
  shelf_book_id uuid not null references shelf_books(id) on delete cascade,
  book_id       text not null references books(id) on delete cascade,
  position      int not null,
  primary key (shelf_book_id, position)
);

-- ── Shelf decor ───────────────────────────────────────────────────────────────────────

create table if not exists shelf_decor (
  id           uuid primary key default gen_random_uuid(),
  shelf_row_id uuid not null references shelf_rows(id) on delete cascade,
  decor_type   text not null,
  start_slot   int not null,
  slot_width   int not null
);

-- ── Reviews ───────────────────────────────────────────────────────────────────────────

create table if not exists reviews (
  user_id      uuid not null references users(id) on delete cascade,
  book_id      text not null references books(id) on delete cascade,
  review_text  text not null default '',
  rating       int not null default 0 check (rating >= 0 and rating <= 5),
  updated_at   timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- ── Inventory (off-shelf staging area in build mode) ──────────────────────────────────

create table if not exists inventory_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  item_type  text not null check (item_type in ('book', 'stack', 'decor')),
  book_id    text references books(id) on delete set null,
  book_ids   text[],
  decor_type text,
  added_at   timestamptz not null default now()
);

create index if not exists inventory_items_user_id_idx on inventory_items(user_id);

-- ── Row Level Security (permissive for anon key prototype — tighten before production) ─

alter table users           enable row level security;
alter table bookshelves     enable row level security;
alter table shelf_rows      enable row level security;
alter table shelf_books     enable row level security;
alter table stack_books     enable row level security;
alter table shelf_decor     enable row level security;
alter table books           enable row level security;
alter table reviews         enable row level security;
alter table inventory_items enable row level security;

-- Allow all operations via the anon key (matches current client-side IP identity model).
-- Replace with auth.uid()-scoped policies when Supabase Auth is added.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'anon_all') then
    create policy anon_all on users for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'bookshelves' and policyname = 'anon_all') then
    create policy anon_all on bookshelves for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'shelf_rows' and policyname = 'anon_all') then
    create policy anon_all on shelf_rows for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'shelf_books' and policyname = 'anon_all') then
    create policy anon_all on shelf_books for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'stack_books' and policyname = 'anon_all') then
    create policy anon_all on stack_books for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'shelf_decor' and policyname = 'anon_all') then
    create policy anon_all on shelf_decor for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'books' and policyname = 'anon_all') then
    create policy anon_all on books for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'anon_all') then
    create policy anon_all on reviews for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'inventory_items' and policyname = 'anon_all') then
    create policy anon_all on inventory_items for all using (true) with check (true);
  end if;
end $$;
