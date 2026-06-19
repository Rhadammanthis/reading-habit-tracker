/**
 * Pure reading-estimation math. No React/Expo/Supabase imports so this is
 * trivially unit-testable and reusable across UI and services.
 *
 * Word counts are estimated from page counts (Google Books rarely exposes a
 * real word count) using a configurable words-per-page factor.
 */

import { DEFAULT_WORDS_PER_PAGE } from '@/types/models';

/** Estimate a book's total word count from its page count. */
export function wordsForBook(
  pageCount: number,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): number {
  if (pageCount <= 0 || wordsPerPage <= 0) return 0;
  return Math.round(pageCount * wordsPerPage);
}

/** Words still left to read in a book (never negative). */
export function remainingWords(args: { wordCountEstimate: number; currentWord: number }): number {
  return Math.max(0, args.wordCountEstimate - args.currentWord);
}

/** Fraction of the book read so far, clamped to 0..1. */
export function progressFraction(args: { wordCountEstimate: number; currentWord: number }): number {
  if (args.wordCountEstimate <= 0) return 0;
  return Math.max(0, Math.min(1, args.currentWord / args.wordCountEstimate));
}

/** Minutes of reading needed to finish the remaining words at a given speed. */
export function estimateMinutesToFinish(args: { remainingWords: number; wpm: number }): number {
  if (args.wpm <= 0) return 0;
  return args.remainingWords / args.wpm;
}

/**
 * Calendar days to finish given a per-day time budget. Rounds up because a
 * partial day still counts as a reading day; returns 0 when nothing remains.
 */
export function estimateDaysToFinish(args: {
  remainingWords: number;
  wpm: number;
  goalMinutesPerDay: number;
}): number {
  if (args.remainingWords <= 0) return 0;
  if (args.wpm <= 0 || args.goalMinutesPerDay <= 0) return Infinity;
  const minutes = estimateMinutesToFinish({ remainingWords: args.remainingWords, wpm: args.wpm });
  return Math.ceil(minutes / args.goalMinutesPerDay);
}

/** Words a reader covers in a number of minutes at a given speed. */
export function wordsReadFromMinutes(minutes: number, wpm: number): number {
  if (minutes <= 0 || wpm <= 0) return 0;
  return Math.round(minutes * wpm);
}

/** Convert a word offset into an approximate page number. */
export function pageFromWords(
  words: number,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): number {
  if (wordsPerPage <= 0) return 0;
  return Math.round(words / wordsPerPage);
}

/** Convert a page number into an approximate word offset. */
export function wordsFromPage(
  page: number,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): number {
  if (page <= 0) return 0;
  return Math.round(page * wordsPerPage);
}
