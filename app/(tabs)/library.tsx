import React from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  ScreenContainer,
  ThemedText,
  Card,
  Button,
  SectionLabel,
  CenteredMessage,
  FullScreenLoader,
} from '@/components/ui';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import { useLibrary, useQueue } from '@/hooks/useBooks';
import { formatDate } from '@/lib/format';
import { Book } from '@/types/models';

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: finished, isLoading: loadingFinished, refetch: refetchFinished, isRefetching } = useLibrary();
  const { data: queue, isLoading: loadingQueue, refetch: refetchQueue } = useQueue();

  if (loadingFinished || loadingQueue) return <FullScreenLoader />;

  const hasQueue = !!queue && queue.length > 0;
  const hasFinished = !!finished && finished.length > 0;

  function refetch() {
    refetchFinished();
    refetchQueue();
  }

  function renderBook(item: Book, subtitle: React.ReactNode) {
    return (
      <Pressable onPress={() => router.push(`/book/${item.id}`)}>
        <Card style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
          <BookCover uri={item.cover_url} width={48} />
          <View style={{ flex: 1 }}>
            <ThemedText variant="subheading" numberOfLines={2}>{item.title}</ThemedText>
            {item.author ? <ThemedText muted numberOfLines={1}>{item.author}</ThemedText> : null}
            <ThemedText variant="caption" muted style={{ marginTop: 2 }}>
              {subtitle}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </Card>
      </Pressable>
    );
  }

  const header = (
    <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
      <Button title="Add a book" onPress={() => router.push('/add-book')} />

      {hasQueue ? (
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <SectionLabel>Up next</SectionLabel>
          {queue!.map((item) => (
            <View key={item.id}>
              {renderBook(
                item,
                item.page_count > 0 ? `${item.page_count} pages` : 'On your reading list',
              )}
            </View>
          ))}
        </View>
      ) : null}

      {hasFinished ? (
        <SectionLabel style={{ marginTop: theme.spacing.md }}>Finished</SectionLabel>
      ) : null}
    </View>
  );

  if (!hasQueue && !hasFinished) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.lg, gap: theme.spacing.lg }}>
          <CenteredMessage
            title="Your shelf is empty"
            message="Build a reading list of books to read next, and finished books will land here too."
          />
          <Button title="Add a book" onPress={() => router.push('/add-book')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['left', 'right']}>
      <FlatList
        data={hasFinished ? finished : []}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />
        }
        renderItem={({ item }) =>
          renderBook(item, `Finished ${item.finished_at ? formatDate(item.finished_at) : ''}`)
        }
      />
    </ScreenContainer>
  );
}
