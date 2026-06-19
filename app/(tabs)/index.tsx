import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  ScreenContainer,
  ThemedText,
  Button,
  Card,
  SectionLabel,
  FullScreenLoader,
} from '@/components/ui';
import { ProgressRing } from '@/components/ProgressRing';
import { BookCover } from '@/components/BookCover';
import { useTheme } from '@/theme/ThemeProvider';
import { useActiveBook, useBookSessions } from '@/hooks/useBooks';
import { useProfile } from '@/hooks/useProfile';
import { useEffectiveWpm, useLatestSpeedTest } from '@/hooks/useSpeedTest';
import {
  progressFraction,
  remainingWords,
  estimateDaysToFinish,
} from '@/domain/estimation';
import { formatDaysEstimate, formatMinutes } from '@/lib/format';
import { isSupabaseConfigured } from '@/lib/env';
import { DEFAULT_WORDS_PER_PAGE } from '@/types/models';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { data: profile } = useProfile();
  const { data: speedTest, isLoading: loadingSpeed } = useLatestSpeedTest();
  const wpm = useEffectiveWpm();
  const { data: activeBook, isLoading: loadingBook, refetch, isRefetching } = useActiveBook();
  const { data: sessions } = useBookSessions(activeBook?.id);

  if (!isSupabaseConfigured) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md }}>
          <ThemedText variant="heading">Almost there</ThemedText>
          <ThemedText muted>
            Add your Supabase URL and anon key to a .env file (see .env.example) and reload to enable
            accounts and sync.
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (loadingBook || loadingSpeed) {
    return <FullScreenLoader />;
  }

  const lastSession = sessions?.[0];
  const wordsPerPage = profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE;

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}
      >
        {/* Speed-test nudge */}
        {!speedTest && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Ionicons name="speedometer-outline" size={28} color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText variant="subheading">Find your reading speed</ThemedText>
              <ThemedText muted variant="caption">
                A 1-minute test makes your finish-time estimates accurate.
              </ThemedText>
            </View>
            <Button title="Start" onPress={() => router.push('/onboarding/speed-test')} style={{ paddingHorizontal: theme.spacing.lg }} />
          </Card>
        )}

        {!activeBook ? (
          <Card style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl, gap: theme.spacing.md }}>
            <Ionicons name="book-outline" size={40} color={theme.colors.textMuted} />
            <ThemedText variant="heading">No book yet</ThemedText>
            <ThemedText muted style={{ textAlign: 'center' }}>
              Pick a book and a small daily goal. We’ll turn it into a finish-by estimate and track
              every session.
            </ThemedText>
            <Button title="Add a book" onPress={() => router.push('/add-book')} style={{ alignSelf: 'stretch' }} />
          </Card>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: theme.spacing.lg, alignItems: 'center' }}>
              <BookCover uri={activeBook.cover_url} width={64} />
              <View style={{ flex: 1 }}>
                <SectionLabel>Currently reading</SectionLabel>
                <ThemedText variant="heading" numberOfLines={2}>{activeBook.title}</ThemedText>
                {activeBook.author ? <ThemedText muted numberOfLines={1}>{activeBook.author}</ThemedText> : null}
              </View>
            </View>

            <Card style={{ alignItems: 'center', gap: theme.spacing.md }}>
              <ProgressRing
                progress={progressFraction({
                  wordCountEstimate: activeBook.word_count_estimate,
                  currentWord: activeBook.current_word,
                })}
                caption={`page ${activeBook.current_page} of ${activeBook.page_count}`}
              />
              <ThemedText variant="subheading">
                {formatDaysEstimate(
                  estimateDaysToFinish({
                    remainingWords: remainingWords({
                      wordCountEstimate: activeBook.word_count_estimate,
                      currentWord: activeBook.current_word,
                    }),
                    wpm,
                    goalMinutesPerDay: activeBook.goal_minutes_per_day,
                  }),
                )}
              </ThemedText>
              <ThemedText muted variant="caption">
                at {formatMinutes(activeBook.goal_minutes_per_day)}/day · {wpm} wpm
              </ThemedText>
            </Card>

            {lastSession && (
              <Card>
                <SectionLabel>Last session</SectionLabel>
                <ThemedText>
                  {formatMinutes(lastSession.duration_seconds / 60)} · {lastSession.pages_read} pages ·{' '}
                  {lastSession.words_read.toLocaleString()} words
                </ThemedText>
              </Card>
            )}

            <Button
              title="Start reading session"
              onPress={() => router.push('/session/timer')}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
