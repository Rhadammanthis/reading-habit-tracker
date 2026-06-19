/**
 * Pure logic for applying a finished reading session to a book's progress.
 *
 * The user can finish a session in one of two ways (their choice, per session):
 *  - 'estimate': assume they read at their tested speed for the elapsed time.
 *  - 'manual':   they tell us the page they actually reached.
 */

import { wordsReadFromMinutes, pageFromWords, wordsFromPage } from './estimation';

export type ProgressMode = 'estimate' | 'manual';

export type BookProgressState = {
  pageCount: number;
  wordCountEstimate: number;
  currentPage: number;
  currentWord: number;
  wordsPerPage: number;
};

export type SessionInput = {
  mode: ProgressMode;
  durationSeconds: number;
  /** Reading speed used for the estimate mode. */
  wpm: number;
  /** Page reached, required for manual mode. */
  manualPage?: number;
};

export type AppliedSession = {
  /** Updated book position. */
  currentPage: number;
  currentWord: number;
  /** What this session contributed (never negative). */
  pagesRead: number;
  wordsRead: number;
  /** Whether the book is now finished. */
  completed: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute the new book position after a session. Progress only ever moves
 * forward — a manual page behind the current position leaves progress unchanged
 * (we never "un-read" pages) but still records the session's elapsed time.
 */
export function applySession(book: BookProgressState, input: SessionInput): AppliedSession {
  const wordsPerPage = book.wordsPerPage > 0 ? book.wordsPerPage : 1;

  let targetWord: number;

  if (input.mode === 'manual' && input.manualPage != null) {
    const page = clamp(Math.round(input.manualPage), 0, book.pageCount);
    // Reaching the last page means the whole book is read, regardless of the
    // page->word rounding.
    targetWord =
      page >= book.pageCount ? book.wordCountEstimate : Math.min(book.wordCountEstimate, wordsFromPage(page, wordsPerPage));
  } else {
    const minutes = Math.max(0, input.durationSeconds) / 60;
    const wordsThisSession = wordsReadFromMinutes(minutes, input.wpm);
    targetWord = Math.min(book.wordCountEstimate, book.currentWord + wordsThisSession);
  }

  // Never regress.
  const newCurrentWord = Math.max(book.currentWord, targetWord);
  const newCurrentPage = clamp(
    Math.max(book.currentPage, pageFromWords(newCurrentWord, wordsPerPage)),
    0,
    book.pageCount,
  );

  const completed = newCurrentWord >= book.wordCountEstimate && book.wordCountEstimate > 0;

  return {
    currentPage: completed ? book.pageCount : newCurrentPage,
    currentWord: completed ? book.wordCountEstimate : newCurrentWord,
    pagesRead: Math.max(0, (completed ? book.pageCount : newCurrentPage) - book.currentPage),
    wordsRead: Math.max(0, (completed ? book.wordCountEstimate : newCurrentWord) - book.currentWord),
    completed,
  };
}
