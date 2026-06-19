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
import { useBook, useBookSessions, useRemoveBook } from '@/hooks/useBooks';
import { formatDate, formatMinutes, daysBetween } from '@/lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
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
  const removeBook = useRemoveBook();

  if (isLoading) return <FullScreenLoader />;
  if (!book) {
    return (
      <ScreenContainer>
        <CenteredMessage title="Book not found" />
      </ScreenContainer>
    );
  }

  const totalSeconds = (sessions ?? []).reduce((s, x) => s + x.duration_seconds, 0);
  const sessionCount = sessions?.length ?? 0;
  const days =
    book.finished_at ? daysBetween(book.started_at, book.finished_at) : daysBetween(book.started_at, new Date().toISOString());

  function confirmRemove() {
    Alert.alert('Remove book?', `“${book!.title}” and its sessions will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeBook.mutateAsync(book!.id);
          router.back();
        },
      },
    ]);
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
            {book.finished_at ? (
              <ThemedText variant="caption" muted style={{ marginTop: theme.spacing.sm }}>
                Finished {formatDate(book.finished_at)}
              </ThemedText>
            ) : null}
          </View>
        </View>

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

        <Button title="Remove from library" variant="ghost" loading={removeBook.isPending} onPress={confirmRemove} />
      </ScrollView>
    </ScreenContainer>
  );
}
