import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import {
  ScreenContainer,
  ThemedText,
  Card,
  Button,
  SectionLabel,
  FullScreenLoader,
  CenteredMessage,
} from '@/components/ui';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import {
  useActiveBook,
  useActivateBook,
  useBook,
  useBookSessions,
  useRemoveBook,
} from '@/hooks/useBooks';
import { formatDate, formatMinutes, daysBetween } from '@/lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: '40%', gap: 2 }}>
      <ThemedText variant="stat" style={{ fontSize: 24 }}>{value}</ThemedText>
      <ThemedText variant="caption" muted>{label}</ThemedText>
    </View>
  );
}

export default function BookDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id);
  const { data: sessions } = useBookSessions(id);
  const { data: activeBook } = useActiveBook();
  const removeBook = useRemoveBook();
  const activateBook = useActivateBook();

  if (isLoading) return <FullScreenLoader />;
  if (!book) {
    return (
      <ScreenContainer>
        <CenteredMessage title="Book not found" />
      </ScreenContainer>
    );
  }

  const isQueued = book.status === 'queued';
  const totalSeconds = (sessions ?? []).reduce((s, x) => s + x.duration_seconds, 0);
  const sessionCount = sessions?.length ?? 0;
  const days =
    book.finished_at ? daysBetween(book.started_at, book.finished_at) : daysBetween(book.started_at, new Date().toISOString());

  function confirmRemove() {
    Alert.alert(
      isQueued ? 'Remove from list?' : 'Remove book?',
      isQueued
        ? `“${book!.title}” will be removed from your reading list.`
        : `“${book!.title}” and its sessions will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeBook.mutateAsync(book!.id);
            router.back();
          },
        },
      ],
    );
  }

  async function startReading() {
    await activateBook.mutateAsync(book!.id);
    router.replace('/(tabs)');
  }

  function confirmStart() {
    // Swapping a book that is already active sets the current one aside.
    if (activeBook && activeBook.id !== book!.id) {
      Alert.alert(
        'Start this book?',
        `“${activeBook.title}” will move to your reading list — your progress is saved so you can pick it back up.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start reading', onPress: startReading },
        ],
      );
    } else {
      startReading();
    }
  }

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: book.title }} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
          <BookCover uri={book.cover_url} width={96} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ThemedText variant="heading">{book.title}</ThemedText>
            {book.author ? <ThemedText muted>{book.author}</ThemedText> : null}
            {isQueued ? (
              <ThemedText variant="caption" muted style={{ marginTop: theme.spacing.sm }}>
                On your reading list
              </ThemedText>
            ) : book.finished_at ? (
              <ThemedText variant="caption" muted style={{ marginTop: theme.spacing.sm }}>
                Finished {formatDate(book.finished_at)}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {isQueued ? (
          <Card>
            <SectionLabel>Book details</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.lg }}>
              <Stat label="Pages" value={String(book.page_count)} />
              <Stat label="Words" value={book.word_count_estimate.toLocaleString()} />
            </View>
          </Card>
        ) : (
          <Card>
            <SectionLabel>Reading stats</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.lg }}>
              <Stat label="Days" value={String(days)} />
              <Stat label="Sessions" value={String(sessionCount)} />
              <Stat label="Time read" value={formatMinutes(totalSeconds / 60)} />
              <Stat label="Pages" value={String(book.page_count)} />
              <Stat label="Words" value={book.word_count_estimate.toLocaleString()} />
            </View>
          </Card>
        )}

        {isQueued ? (
          <Button title="Start reading now" loading={activateBook.isPending} onPress={confirmStart} />
        ) : null}

        <Button
          title={isQueued ? 'Remove from list' : 'Remove from library'}
          variant="ghost"
          loading={removeBook.isPending}
          onPress={confirmRemove}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
