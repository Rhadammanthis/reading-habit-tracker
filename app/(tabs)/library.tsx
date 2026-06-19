import React from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ScreenContainer,
  ThemedText,
  Card,
  CenteredMessage,
  FullScreenLoader,
} from '@/components/ui';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import { useLibrary } from '@/hooks/useBooks';
import { formatDate } from '@/lib/format';

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: books, isLoading, refetch, isRefetching } = useLibrary();

  if (isLoading) return <FullScreenLoader />;

  if (!books || books.length === 0) {
    return (
      <ScreenContainer>
        <CenteredMessage
          title="Your shelf is empty"
          message="Books you finish will land here, with the time and pages it took to read them."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['left', 'right']}>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        numColumns={1}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/book/${item.id}`)}>
            <Card style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
              <BookCover uri={item.cover_url} width={48} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="subheading" numberOfLines={2}>{item.title}</ThemedText>
                {item.author ? <ThemedText muted numberOfLines={1}>{item.author}</ThemedText> : null}
                <ThemedText variant="caption" muted style={{ marginTop: 2 }}>
                  Finished {item.finished_at ? formatDate(item.finished_at) : ''}
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
