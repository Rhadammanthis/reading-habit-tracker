import { env } from '@/lib/env';
import { wordsForBook } from '@/domain/estimation';
import { BookSearchResult, DEFAULT_WORDS_PER_PAGE } from '@/types/models';

const BASE = 'https://www.googleapis.com/books/v1/volumes';

type GoogleVolume = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
  };
};

function pickIsbn(volume: GoogleVolume): string | null {
  const ids = volume.volumeInfo?.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === 'ISBN_13');
  const isbn10 = ids.find((i) => i.type === 'ISBN_10');
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

function normalize(volume: GoogleVolume, wordsPerPage: number): BookSearchResult {
  const info = volume.volumeInfo ?? {};
  const pageCount = info.pageCount ?? 0;
  // Google rarely exposes word count, so estimate from pages.
  const wordEstimate = wordsForBook(pageCount, wordsPerPage);
  const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;
  return {
    google_books_id: volume.id,
    isbn: pickIsbn(volume),
    title: info.title ?? 'Untitled',
    author: info.authors?.join(', ') ?? null,
    // Force https so RN's image loader doesn't drop it on iOS ATS.
    cover_url: rawCover ? rawCover.replace(/^http:/, 'https:') : null,
    page_count: pageCount,
    word_count_estimate: wordEstimate,
  };
}

function withKey(url: string): string {
  return env.googleBooksApiKey ? `${url}&key=${env.googleBooksApiKey}` : url;
}

/** Search Google Books by free-text query (title/author). */
export async function searchBooks(
  query: string,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = withKey(`${BASE}?q=${encodeURIComponent(trimmed)}&maxResults=20&printType=books`);
  console.debug(`Searching Google Books: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Book search failed (${res.status})`);
  const json = (await res.json()) as { items?: GoogleVolume[] };
  return (json.items ?? [])
    .map((v) => normalize(v, wordsPerPage))
    // Books without a page count can't be estimated — keep them but they'll
    // need a manual page entry, so we drop only truly empty results.
    .filter((b) => b.title !== 'Untitled' || b.author);
}

/** Look up a single book by ISBN (used by the barcode scanner). */
export async function getByIsbn(
  isbn: string,
  wordsPerPage: number = DEFAULT_WORDS_PER_PAGE,
): Promise<BookSearchResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, '');
  if (!clean) return null;
  const url = withKey(`${BASE}?q=isbn:${encodeURIComponent(clean)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ISBN lookup failed (${res.status})`);
  const json = (await res.json()) as { items?: GoogleVolume[] };
  const first = json.items?.[0];
  if (!first) return null;
  const normalized = normalize(first, wordsPerPage);
  // Prefer the scanned ISBN if the volume didn't report one.
  return { ...normalized, isbn: normalized.isbn ?? clean };
}
