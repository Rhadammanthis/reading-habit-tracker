/**
 * Core domain types, shared between the pure domain logic, services, and UI.
 * These mirror the Supabase tables (snake_case columns) so rows map directly.
 */

export type BookStatus = 'active' | 'finished';
export type ProgressMode = 'estimate' | 'manual';
export type SpeedTestVariant = 'timed' | 'comprehension';
export type ThemePref = 'system' | 'light' | 'dark';

/** Words assumed per page when a real word count is unavailable. */
export const DEFAULT_WORDS_PER_PAGE = 275;
/** Fallback reading speed before the user takes the speed test. */
export const DEFAULT_WPM = 200;
/** Default daily reading goal in minutes. */
export const DEFAULT_GOAL_MINUTES = 20;

export type Profile = {
  id: string;
  display_name: string | null;
  words_per_page: number;
  default_goal_minutes: number;
  theme_pref: ThemePref;
};

export type SpeedTest = {
  id: string;
  user_id: string;
  wpm: number;
  variant: SpeedTestVariant;
  comprehension_score: number | null;
  taken_at: string;
};

export type Book = {
  id: string;
  user_id: string;
  google_books_id: string | null;
  isbn: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number;
  word_count_estimate: number;
  status: BookStatus;
  goal_minutes_per_day: number;
  current_page: number;
  current_word: number;
  started_at: string;
  finished_at: string | null;
};

export type ReadingSession = {
  id: string;
  book_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  pages_read: number;
  words_read: number;
  progress_mode: ProgressMode;
};

/** Normalized search result from the Google Books service. */
export type BookSearchResult = {
  google_books_id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number;
  word_count_estimate: number;
};
