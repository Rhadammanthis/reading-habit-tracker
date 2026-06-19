import { supabase } from './supabase';
import { Book, BookSearchResult, ReadingSession } from '@/types/models';

const BOOK_COLUMNS =
  'id, user_id, google_books_id, isbn, title, author, cover_url, page_count, word_count_estimate, status, goal_minutes_per_day, current_page, current_word, started_at, finished_at';

/** The user's single active book, or null. */
export async function fetchActiveBook(userId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return (data as Book) ?? null;
}

/** Finished books, newest first. */
export async function fetchLibrary(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'finished')
    .order('finished_at', { ascending: false });

  if (error) throw error;
  return (data as Book[]) ?? [];
}

export async function fetchBook(bookId: string): Promise<Book | null> {
  const { data, error } = await supabase.from('books').select(BOOK_COLUMNS).eq('id', bookId).maybeSingle();
  if (error) throw error;
  return (data as Book) ?? null;
}

/** Create the active book from a search result (or manual entry). */
export async function createActiveBook(args: {
  userId: string;
  book: BookSearchResult;
  goalMinutesPerDay: number;
}): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: args.userId,
      google_books_id: args.book.google_books_id || null,
      isbn: args.book.isbn,
      title: args.book.title,
      author: args.book.author,
      cover_url: args.book.cover_url,
      page_count: args.book.page_count,
      word_count_estimate: args.book.word_count_estimate,
      goal_minutes_per_day: args.goalMinutesPerDay,
      status: 'active',
    })
    .select(BOOK_COLUMNS)
    .single();

  if (error) throw error;
  return data as Book;
}

/** Update mutable book fields (progress, goal). */
export async function updateBook(
  bookId: string,
  patch: Partial<
    Pick<Book, 'current_page' | 'current_word' | 'goal_minutes_per_day' | 'status' | 'finished_at'>
  >,
): Promise<void> {
  const { error } = await supabase.from('books').update(patch).eq('id', bookId);
  if (error) throw error;
}

export async function deleteBook(bookId: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', bookId);
  if (error) throw error;
}

const SESSION_COLUMNS =
  'id, book_id, user_id, started_at, ended_at, duration_seconds, pages_read, words_read, progress_mode';

export async function insertSession(args: {
  userId: string;
  bookId: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  pagesRead: number;
  wordsRead: number;
  progressMode: 'estimate' | 'manual';
}): Promise<ReadingSession> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: args.userId,
      book_id: args.bookId,
      started_at: args.startedAt,
      ended_at: args.endedAt,
      duration_seconds: args.durationSeconds,
      pages_read: args.pagesRead,
      words_read: args.wordsRead,
      progress_mode: args.progressMode,
    })
    .select(SESSION_COLUMNS)
    .single();

  if (error) throw error;
  return data as ReadingSession;
}

export async function fetchSessionsForBook(bookId: string): Promise<ReadingSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('book_id', bookId)
    .order('ended_at', { ascending: false });

  if (error) throw error;
  return (data as ReadingSession[]) ?? [];
}
