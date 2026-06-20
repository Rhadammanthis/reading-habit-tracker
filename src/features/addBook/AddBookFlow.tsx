import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  ScreenContainer,
  ThemedText,
  Button,
  Card,
  SectionLabel,
  CenteredMessage,
} from '@/components/ui';
import { BookCover } from '@/components/BookCover';
import { BarcodeScanner } from '@/features/addBook/BarcodeScanner';
import { useTheme } from '@/theme/ThemeProvider';
import { searchBooks, getByIsbn } from '@/services/googleBooks';
import { useProfile } from '@/hooks/useProfile';
import { useActiveBook, useAddBook, useActivateBook } from '@/hooks/useBooks';
import { wordsForBook } from '@/domain/estimation';
import {
  BookSearchResult,
  DEFAULT_GOAL_MINUTES,
  DEFAULT_WORDS_PER_PAGE,
} from '@/types/models';

const GOAL_PRESETS = [10, 15, 20, 30, 45];

type Mode = 'search' | 'manual' | 'confirm';

/** Where the user landed after adding a book — drives post-add navigation. */
export type AddBookDestination = 'home' | 'library';

/**
 * Search / scan / manual-entry flow for adding a book, then start it now or
 * queue it on the reading list. Navigation-agnostic: the host supplies
 * `onAdded`, called with where the user should go next once a book is added.
 *
 * Used both as the standalone "Add a book" modal and as the final onboarding
 * step. When `hideAddToList` is set (onboarding's "add your first book"), only
 * the start-now path is offered so the user ends up with a current book.
 */
export function AddBookFlow({
  onAdded,
  hideAddToList = false,
}: {
  onAdded: (destination: AddBookDestination) => void;
  hideAddToList?: boolean;
}) {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: activeBook } = useActiveBook();
  const addBook = useAddBook();
  const activateBook = useActivateBook();
  const busy = addBook.isPending || activateBook.isPending;

  const wordsPerPage = profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE;

  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [selected, setSelected] = useState<BookSearchResult | null>(null);
  const [goal, setGoal] = useState<number>(profile?.default_goal_minutes ?? DEFAULT_GOAL_MINUTES);

  // Manual-entry fields.
  const [mTitle, setMTitle] = useState('');
  const [mAuthor, setMAuthor] = useState('');
  const [mPages, setMPages] = useState('');

  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
  };

  async function runSearch() {
    setError(null);
    setSearching(true);
    try {
      const r = await searchBooks(query, wordsPerPage);
      setResults(r);
      if (r.length === 0) setError('No books found. Try another title, or add it manually.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function handleScanned(isbn: string) {
    setScannerOpen(false);
    setSearching(true);
    setError(null);
    try {
      const book = await getByIsbn(isbn, wordsPerPage);
      if (book) {
        pick(book);
      } else {
        setError(`No book found for barcode ${isbn}. Try searching by title.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ISBN lookup failed.');
    } finally {
      setSearching(false);
    }
  }

  function pick(book: BookSearchResult) {
    setSelected(book);
    setGoal(profile?.default_goal_minutes ?? DEFAULT_GOAL_MINUTES);
    setMode('confirm');
  }

  function submitManual() {
    const pages = parseInt(mPages, 10);
    if (!mTitle.trim()) {
      setError('Enter a title.');
      return;
    }
    if (!pages || pages <= 0) {
      setError('Enter the page count so we can estimate the reading time.');
      return;
    }
    pick({
      google_books_id: '',
      isbn: null,
      title: mTitle.trim(),
      author: mAuthor.trim() || null,
      cover_url: null,
      page_count: pages,
      word_count_estimate: wordsForBook(pages, wordsPerPage),
    });
  }

  function describeError(e: unknown, fallback: string) {
    return e instanceof Error ? e.message : fallback;
  }

  // Start reading the selected book now. If another book is already active, it
  // is swapped back to the reading list (progress preserved) via activateBook.
  async function startNow() {
    if (!selected) return;
    setError(null);
    try {
      if (activeBook) {
        const created = await addBook.mutateAsync({
          book: selected,
          goalMinutesPerDay: goal,
          status: 'queued',
        });
        await activateBook.mutateAsync(created.id);
      } else {
        await addBook.mutateAsync({ book: selected, goalMinutesPerDay: goal, status: 'active' });
      }
      onAdded('home');
    } catch (e) {
      setError(describeError(e, 'Could not start this book.'));
    }
  }

  // Add the selected book to the reading list without starting it.
  async function addToList() {
    if (!selected) return;
    setError(null);
    try {
      await addBook.mutateAsync({ book: selected, goalMinutesPerDay: goal, status: 'queued' });
      onAdded('library');
    } catch (e) {
      setError(describeError(e, 'Could not add this book.'));
    }
  }

  // ---- Confirm step --------------------------------------------------------
  if (mode === 'confirm' && selected) {
    return (
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <View style={{ flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <Card style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
            <BookCover uri={selected.cover_url} width={72} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <ThemedText variant="subheading">{selected.title}</ThemedText>
              {selected.author ? <ThemedText muted>{selected.author}</ThemedText> : null}
              <ThemedText variant="caption" muted style={{ marginTop: 4 }}>
                {selected.page_count} pages · ~{selected.word_count_estimate.toLocaleString()} words
              </ThemedText>
            </View>
          </Card>

          <View>
            <SectionLabel>Daily reading goal</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {GOAL_PRESETS.map((m) => {
                const on = goal === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setGoal(m)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: theme.spacing.lg,
                      borderRadius: theme.radius.pill,
                      borderWidth: 1,
                      borderColor: on ? theme.colors.accent : theme.colors.border,
                      backgroundColor: on ? theme.colors.accentMuted : 'transparent',
                    }}
                  >
                    <ThemedText color={on ? theme.colors.accent : undefined}>{m} min</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {activeBook ? (
            <ThemedText variant="caption" muted>
              You’re currently reading “{activeBook.title}”. Starting this now moves it to your
              reading list — your progress is saved so you can pick it back up.
            </ThemedText>
          ) : null}

          {error ? <ThemedText color={theme.colors.danger}>{error}</ThemedText> : null}

          <View style={{ flex: 1 }} />
          <Button
            title={activeBook ? 'Start reading now' : 'Start reading this book'}
            loading={busy}
            onPress={startNow}
          />
          {hideAddToList ? null : (
            <Button title="Add to reading list" variant="secondary" disabled={busy} onPress={addToList} />
          )}
          <Button
            title="Back"
            variant="ghost"
            disabled={busy}
            onPress={() => {
              setSelected(null);
              setError(null);
              setMode('search');
            }}
          />
        </View>
      </ScreenContainer>
    );
  }

  // ---- Manual entry --------------------------------------------------------
  if (mode === 'manual') {
    return (
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <ThemedText variant="heading">Add manually</ThemedText>
          <SectionLabel>Title</SectionLabel>
          <TextInput style={inputStyle} value={mTitle} onChangeText={setMTitle} placeholder="Book title" placeholderTextColor={theme.colors.textMuted} />
          <SectionLabel>Author (optional)</SectionLabel>
          <TextInput style={inputStyle} value={mAuthor} onChangeText={setMAuthor} placeholder="Author" placeholderTextColor={theme.colors.textMuted} />
          <SectionLabel>Number of pages</SectionLabel>
          <TextInput style={inputStyle} value={mPages} onChangeText={setMPages} keyboardType="number-pad" placeholder="e.g. 320" placeholderTextColor={theme.colors.textMuted} />
          {error ? <ThemedText color={theme.colors.danger}>{error}</ThemedText> : null}
          <View style={{ height: theme.spacing.sm }} />
          <Button title="Continue" onPress={submitManual} />
          <Button title="Back to search" variant="ghost" onPress={() => { setMode('search'); setError(null); }} />
        </View>
      </ScreenContainer>
    );
  }

  // ---- Search --------------------------------------------------------------
  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        {activeBook ? (
          <Card style={{ backgroundColor: theme.colors.accentMuted, borderColor: theme.colors.accent }}>
            <ThemedText variant="caption">
              You’re reading “{activeBook.title}”. Add another to your reading list, or start it now and
              we’ll set this one aside.
            </ThemedText>
          </Card>
        ) : null}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <TextInput
            style={[inputStyle, { flex: 1 }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title or author"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={runSearch}
            autoFocus
          />
          <Pressable
            onPress={() => setScannerOpen(true)}
            style={{
              width: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="barcode-outline" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
        <Button title="Search" onPress={runSearch} loading={searching} />
        <Pressable onPress={() => { setMode('manual'); setError(null); }} style={{ alignSelf: 'center', padding: theme.spacing.sm }}>
          <ThemedText color={theme.colors.accent}>Can’t find it? Add manually</ThemedText>
        </Pressable>
      </View>

      {searching ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: theme.spacing.xl }} />
      ) : error ? (
        <CenteredMessage title="Hmm" message={error} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.google_books_id || item.title}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Pressable onPress={() => pick(item)}>
              <Card style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
                <BookCover uri={item.cover_url} width={44} />
                <View style={{ flex: 1 }}>
                  <ThemedText variant="subheading" numberOfLines={2}>{item.title}</ThemedText>
                  {item.author ? <ThemedText muted numberOfLines={1}>{item.author}</ThemedText> : null}
                  <ThemedText variant="caption" muted>
                    {item.page_count > 0 ? `${item.page_count} pages` : 'Page count unknown'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </Card>
            </Pressable>
          )}
        />
      )}

      <BarcodeScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onScanned={handleScanned} />
    </ScreenContainer>
  );
}
