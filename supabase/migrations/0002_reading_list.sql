-- Reading Habit Tracker — reading list (queue) support.
-- Adds a 'queued' book status so users can build a future reading list, and an
-- atomic RPC to swap which book is currently active.

-- ---------------------------------------------------------------------------
-- Allow a third status: 'queued'. Books in the queue are on the reading list
-- but not yet started. The existing books_one_active_per_user unique index
-- still guarantees at most one 'active' book per user.
-- ---------------------------------------------------------------------------
alter table public.books drop constraint if exists books_status_check;
alter table public.books
  add constraint books_status_check
  check (status in ('queued', 'active', 'finished'));

-- ---------------------------------------------------------------------------
-- activate_book: atomically make a book the user's active book, demoting any
-- currently-active book back to the queue (its progress is preserved so it can
-- be resumed later). Demoting first keeps the single-active unique index happy.
-- ---------------------------------------------------------------------------
create or replace function public.activate_book(p_book_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  select user_id into v_user from public.books where id = p_book_id;
  if v_user is null then
    raise exception 'Book not found';
  end if;
  if v_user <> auth.uid() then
    raise exception 'Not authorized';
  end if;

  -- Demote the current active book (if any other than the target) to the queue.
  update public.books
    set status = 'queued', finished_at = null
    where user_id = v_user and status = 'active' and id <> p_book_id;

  -- Promote the target book to active.
  update public.books
    set status = 'active', finished_at = null
    where id = p_book_id;
end;
$$;
