-- Reading Habit Tracker — initial schema
-- Run this in your Supabase project (SQL editor or `supabase db push`).
-- Row Level Security restricts every row to its owning user (auth.uid()).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds per-user defaults.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  words_per_page integer not null default 275,
  default_goal_minutes integer not null default 20,
  theme_pref text not null default 'system' check (theme_pref in ('system', 'light', 'dark')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles are self-insertable"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles are self-updatable"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- speed_tests: history of reading-speed test results.
-- ---------------------------------------------------------------------------
create table if not exists public.speed_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wpm integer not null check (wpm > 0),
  variant text not null check (variant in ('timed', 'comprehension')),
  comprehension_score numeric,
  taken_at timestamptz not null default now()
);

create index if not exists speed_tests_user_taken_idx
  on public.speed_tests (user_id, taken_at desc);

alter table public.speed_tests enable row level security;

create policy "speed_tests are self-managed"
  on public.speed_tests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- books: tracked books. At most one 'active' book per user.
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_books_id text,
  isbn text,
  title text not null,
  author text,
  cover_url text,
  page_count integer not null default 0,
  word_count_estimate integer not null default 0,
  status text not null default 'active' check (status in ('active', 'finished')),
  goal_minutes_per_day integer not null default 20,
  current_page integer not null default 0,
  current_word integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Enforce a single active book per user.
create unique index if not exists books_one_active_per_user
  on public.books (user_id)
  where status = 'active';

create index if not exists books_user_status_idx
  on public.books (user_id, status);

alter table public.books enable row level security;

create policy "books are self-managed"
  on public.books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sessions: a completed reading session against a book.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  pages_read integer not null default 0,
  words_read integer not null default 0,
  progress_mode text not null default 'estimate' check (progress_mode in ('estimate', 'manual'))
);

create index if not exists sessions_book_idx on public.sessions (book_id, ended_at desc);
create index if not exists sessions_user_idx on public.sessions (user_id, ended_at desc);

alter table public.sessions enable row level security;

create policy "sessions are self-managed"
  on public.sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
