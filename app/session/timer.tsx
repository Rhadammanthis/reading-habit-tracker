import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ScreenContainer,
  ThemedText,
  Button,
  Card,
  SectionLabel,
  Divider,
  CenteredMessage,
  FullScreenLoader,
} from '@/components/ui';
import { ProgressRing } from '@/components/ProgressRing';
import { useTheme } from '@/theme/ThemeProvider';
import { useActiveBook, useFinishSession } from '@/hooks/useBooks';
import { useProfile } from '@/hooks/useProfile';
import { useEffectiveWpm } from '@/hooks/useSpeedTest';
import { useTimerStore, elapsedSeconds } from '@/store/timerStore';
import { scheduleGoalNotification, cancelNotification } from '@/services/notifications';
import { applySession, ProgressMode } from '@/domain/progress';
import { formatClock, formatMinutes } from '@/lib/format';
import { DEFAULT_WORDS_PER_PAGE } from '@/types/models';

const GOAL_PRESETS = [5, 10, 15, 20, 30];

export default function TimerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: book, isLoading } = useActiveBook();
  const { data: profile } = useProfile();
  const wpm = useEffectiveWpm();
  const finishSession = useFinishSession();

  const timer = useTimerStore();
  const [goalMinutes, setGoalMinutes] = useState(book?.goal_minutes_per_day ?? 20);
  const [, forceTick] = useState(0);

  // Default goal to the book's goal once it loads.
  useEffect(() => {
    if (book) setGoalMinutes(book.goal_minutes_per_day);
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render every second while running so the countdown updates.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [timer.status]);

  const elapsed = elapsedSeconds(timer);
  const goalSeconds = timer.goalSeconds || goalMinutes * 60;
  const remaining = Math.max(0, goalSeconds - elapsed);

  // Auto-finish when the goal time is reached.
  useEffect(() => {
    if (timer.status === 'running' && elapsed >= goalSeconds) {
      timer.finish();
    }
  }, [elapsed, goalSeconds, timer]);

  if (isLoading) return <FullScreenLoader />;
  if (!book) {
    return (
      <ScreenContainer>
        <CenteredMessage title="No active book" message="Add a book before starting a session." />
      </ScreenContainer>
    );
  }

  async function begin() {
    const seconds = goalMinutes * 60;
    const fireDate = new Date(Date.now() + seconds * 1000);
    const notificationId = await scheduleGoalNotification({ fireDate, bookTitle: book!.title });
    timer.start({ bookId: book!.id, goalSeconds: seconds, notificationId });
  }

  function endEarly() {
    Alert.alert('End session?', 'You can still log the time you read so far.', [
      { text: 'Keep reading', style: 'cancel' },
      {
        text: 'End session',
        style: 'destructive',
        onPress: () => {
          cancelNotification(timer.notificationId);
          timer.finish();
        },
      },
    ]);
  }

  function leave() {
    cancelNotification(timer.notificationId);
    timer.reset();
    router.back();
  }

  // ---- Setup ---------------------------------------------------------------
  if (timer.status === 'idle') {
    return (
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
          <ThemedText variant="title">Today’s session</ThemedText>
          <ThemedText muted>Set a time, then read. We’ll let you know when you’ve hit your goal.</ThemedText>

          <SectionLabel>Goal</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {GOAL_PRESETS.map((m) => {
              const on = goalMinutes === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setGoalMinutes(m)}
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

          <Button title={`Start ${formatMinutes(goalMinutes)} session`} onPress={begin} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ---- Running / paused ----------------------------------------------------
  if (timer.status === 'running' || timer.status === 'paused') {
    const progress = goalSeconds > 0 ? elapsed / goalSeconds : 0;
    return (
      <ScreenContainer edges={['left', 'right', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.xl }}>
          <ProgressRing
            progress={progress}
            size={240}
            strokeWidth={16}
            label={formatClock(remaining)}
            caption={timer.status === 'paused' ? 'paused' : 'remaining'}
          />
          <ThemedText muted>Reading “{book.title}”</ThemedText>

          <View style={{ alignSelf: 'stretch', gap: theme.spacing.sm }}>
            {timer.status === 'running' ? (
              <Button title="Pause" variant="secondary" onPress={timer.pause} />
            ) : (
              <Button title="Resume" onPress={timer.resume} />
            )}
            <Button title="End session" variant="ghost" onPress={endEarly} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Finished / review ---------------------------------------------------
  return (
    <FinishReview
      book={book}
      wpm={wpm}
      wordsPerPage={profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE}
      durationSeconds={elapsed}
      onCancel={leave}
      onSave={async (mode, manualPage) => {
        await finishSession.mutateAsync({
          book,
          input: { mode, durationSeconds: elapsed, wpm, manualPage },
          startedAt: timer.sessionStartedAtISO ?? new Date().toISOString(),
          endedAt: new Date().toISOString(),
          wordsPerPage: profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE,
        });
        const completed =
          applySession(
            {
              pageCount: book.page_count,
              wordCountEstimate: book.word_count_estimate,
              currentPage: book.current_page,
              currentWord: book.current_word,
              wordsPerPage: profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE,
            },
            { mode, durationSeconds: elapsed, wpm, manualPage },
          ).completed;
        timer.reset();
        if (completed) {
          router.replace('/(tabs)/library');
        } else {
          router.replace('/(tabs)');
        }
      }}
      saving={finishSession.isPending}
    />
  );
}

// ---------------------------------------------------------------------------

function FinishReview({
  book,
  wpm,
  wordsPerPage,
  durationSeconds,
  onSave,
  onCancel,
  saving,
}: {
  book: import('@/types/models').Book;
  wpm: number;
  wordsPerPage: number;
  durationSeconds: number;
  onSave: (mode: ProgressMode, manualPage?: number) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<ProgressMode>('estimate');
  const [pageText, setPageText] = useState(String(book.current_page));

  const manualPage = parseInt(pageText, 10);
  const preview = applySession(
    {
      pageCount: book.page_count,
      wordCountEstimate: book.word_count_estimate,
      currentPage: book.current_page,
      currentWord: book.current_word,
      wordsPerPage,
    },
    { mode, durationSeconds, wpm, manualPage: isNaN(manualPage) ? book.current_page : manualPage },
  );

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <ThemedText variant="title">Session done 🎉</ThemedText>
        <ThemedText muted>
          You read for {formatMinutes(durationSeconds / 60)}. How should we update your progress?
        </ThemedText>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {(['estimate', 'manual'] as ProgressMode[]).map((m) => {
            const on = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: on ? theme.colors.accent : theme.colors.border,
                  backgroundColor: on ? theme.colors.accentMuted : 'transparent',
                }}
              >
                <ThemedText color={on ? theme.colors.accent : undefined}>
                  {m === 'estimate' ? 'Use my pace' : 'Enter page'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {mode === 'manual' && (
          <View>
            <SectionLabel>Page you reached</SectionLabel>
            <TextInput
              value={pageText}
              onChangeText={setPageText}
              keyboardType="number-pad"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 12,
                color: theme.colors.text,
                fontSize: 16,
              }}
              placeholder={`0 – ${book.page_count}`}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        )}

        <Card>
          <SectionLabel>This session adds</SectionLabel>
          <ThemedText variant="subheading">
            {preview.pagesRead} pages · {preview.wordsRead.toLocaleString()} words
          </ThemedText>
          <Divider />
          <ThemedText muted>
            New position: page {preview.currentPage} of {book.page_count}
            {preview.completed ? ' — book finished!' : ''}
          </ThemedText>
        </Card>

        <Button
          title={preview.completed ? 'Finish book' : 'Save session'}
          loading={saving}
          onPress={() => onSave(mode, isNaN(manualPage) ? undefined : manualPage)}
        />
        <Button title="Discard" variant="ghost" onPress={onCancel} />
      </ScrollView>
    </ScreenContainer>
  );
}
