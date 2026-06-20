import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import {
  activateBook,
  createBook,
  deleteBook,
  fetchActiveBook,
  fetchBook,
  fetchLibrary,
  fetchQueue,
  fetchSessionsForBook,
  insertSession,
  updateBook,
} from '@/services/books';
import { applySession, SessionInput } from '@/domain/progress';
import { Book, BookSearchResult, BookStatus } from '@/types/models';
import { queryKeys } from './queryKeys';

export function useActiveBook() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.activeBook(userId ?? 'anon'),
    queryFn: () => fetchActiveBook(userId as string),
    enabled: !!userId,
  });
}

export function useLibrary() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.library(userId ?? 'anon'),
    queryFn: () => fetchLibrary(userId as string),
    enabled: !!userId,
  });
}

export function useQueue() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.queue(userId ?? 'anon'),
    queryFn: () => fetchQueue(userId as string),
    enabled: !!userId,
  });
}

export function useBook(bookId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.book(bookId ?? 'none'),
    queryFn: () => fetchBook(bookId as string),
    enabled: !!bookId,
  });
}

export function useBookSessions(bookId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions(bookId ?? 'none'),
    queryFn: () => fetchSessionsForBook(bookId as string),
    enabled: !!bookId,
  });
}

/**
 * Add a book to the reading list ('queued') or start it immediately ('active').
 * Returns the created book so callers can chain a swap (see useActivateBook).
 */
export function useAddBook() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      book: BookSearchResult;
      goalMinutesPerDay: number;
      status: Extract<BookStatus, 'active' | 'queued'>;
    }) => createBook({ userId: userId as string, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activeBook(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: queryKeys.queue(userId ?? 'anon') });
    },
  });
}

/**
 * Make a queued (or paused) book the active one, swapping out whatever book is
 * currently active — it returns to the reading list with its progress intact.
 */
export function useActivateBook() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => activateBook(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activeBook(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: queryKeys.queue(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: ['books', 'detail'] });
    },
  });
}

export function useUpdateGoal() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { bookId: string; goalMinutesPerDay: number }) =>
      updateBook(args.bookId, { goal_minutes_per_day: args.goalMinutesPerDay }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activeBook(userId ?? 'anon') });
    },
  });
}

export function useRemoveBook() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => deleteBook(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activeBook(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: queryKeys.queue(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: queryKeys.library(userId ?? 'anon') });
    },
  });
}

export type FinishSessionArgs = {
  book: Book;
  input: SessionInput;
  startedAt: string;
  endedAt: string;
  wordsPerPage: number;
};

export type FinishSessionResult = {
  completed: boolean;
  pagesRead: number;
  wordsRead: number;
};

/**
 * Apply a finished reading session: compute new progress via the pure domain
 * logic, persist the session row + book update, and flip the book to 'finished'
 * when complete. Returns what the session contributed for the success UI.
 */
export function useFinishSession() {
  const { userId } = useAuth();
  const qc = useQueryClient();

  return useMutation<FinishSessionResult, Error, FinishSessionArgs>({
    mutationFn: async ({ book, input, startedAt, endedAt, wordsPerPage }) => {
      const applied = applySession(
        {
          pageCount: book.page_count,
          wordCountEstimate: book.word_count_estimate,
          currentPage: book.current_page,
          currentWord: book.current_word,
          wordsPerPage,
        },
        input,
      );

      await insertSession({
        userId: userId as string,
        bookId: book.id,
        startedAt,
        endedAt,
        durationSeconds: input.durationSeconds,
        pagesRead: applied.pagesRead,
        wordsRead: applied.wordsRead,
        progressMode: input.mode,
      });

      await updateBook(book.id, {
        current_page: applied.currentPage,
        current_word: applied.currentWord,
        status: applied.completed ? 'finished' : 'active',
        finished_at: applied.completed ? endedAt : null,
      });

      return {
        completed: applied.completed,
        pagesRead: applied.pagesRead,
        wordsRead: applied.wordsRead,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.activeBook(userId ?? 'anon') });
      qc.invalidateQueries({ queryKey: queryKeys.library(userId ?? 'anon') });
    },
  });
}
