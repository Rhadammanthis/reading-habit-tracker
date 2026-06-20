-- Reading Habit Tracker — onboarding progress.
-- Tracks where a user is in first-run onboarding so the flow can resume after an
-- interruption, and so only fully-onboarded users reach the main app.

-- ---------------------------------------------------------------------------
-- profiles.onboarding_step: the next step the user needs to complete.
--   'name'       -> still needs to provide a display name
--   'speed_test' -> needs to take (or skip) the reading speed test
--   'goal'       -> needs to set an initial daily reading goal
--   'add_book'   -> needs to add their first (current) book
--   'done'       -> fully onboarded; allowed into the main app
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists onboarding_step text not null default 'name'
  check (onboarding_step in ('name', 'speed_test', 'goal', 'add_book', 'done'));

-- Existing users are already using the app — don't push them back through
-- onboarding. (Runs once at migration time; new rows keep the default.)
update public.profiles set onboarding_step = 'done';

-- ---------------------------------------------------------------------------
-- Recreate the signup trigger so a display name captured at account creation
-- (passed as user metadata) lets the user skip straight to the speed test.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, onboarding_step)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    case
      when coalesce(trim(new.raw_user_meta_data ->> 'display_name'), '') <> ''
        then 'speed_test'
      else 'name'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
