import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer, ThemedText, Button, Card, SectionLabel, Divider } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { pickPassage } from '@/features/speedTest/passages';
import { SPEED_TEST_VARIANT, computeWpm, clampWpm } from '@/features/speedTest/config';
import { useSaveSpeedTest } from '@/hooks/useSpeedTest';
import { DEFAULT_WPM } from '@/types/models';

type Phase = 'intro' | 'reading' | 'questions' | 'result';

export default function SpeedTestScreen() {
  const theme = useTheme();
  const router = useRouter();
  const save = useSaveSpeedTest();

  const variant = SPEED_TEST_VARIANT;
  const passage = useMemo(() => pickPassage(Math.floor(Math.random() * 2)), []);

  const [phase, setPhase] = useState<Phase>('intro');
  const startRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => passage.questions.map(() => null));
  const [saved, setSaved] = useState(false);

  const wpm = clampWpm(computeWpm(passage.wordCount, elapsedMs) || DEFAULT_WPM);
  const comprehensionScore = useMemo(() => {
    const answered = answers.filter((a) => a != null).length;
    if (answered === 0) return 0;
    const correct = answers.reduce<number>(
      (n, a, i) => n + (a === passage.questions[i].answer ? 1 : 0),
      0,
    );
    return correct / passage.questions.length;
  }, [answers, passage.questions]);

  function startReading() {
    startRef.current = Date.now();
    setPhase('reading');
  }

  function finishReading() {
    setElapsedMs(Date.now() - startRef.current);
    setPhase(variant === 'comprehension' ? 'questions' : 'result');
  }

  async function persist() {
    try {
      await save.mutateAsync({
        wpm,
        variant,
        comprehensionScore: variant === 'comprehension' ? comprehensionScore : null,
      });
      setSaved(true);
    } catch {
      // Surface a soft failure but still let the user continue.
      setSaved(true);
    }
  }

  function done() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  // Persist exactly once when the result screen first shows.
  useEffect(() => {
    if (phase === 'result' && !saved && !save.isPending) {
      persist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        {phase === 'intro' && (
          <>
            <ThemedText variant="title">How fast do you read?</ThemedText>
            <ThemedText muted>
              You’ll read a short passage at your natural pace. We’ll time it to estimate your
              words-per-minute, which powers your finish-time estimates.
              {variant === 'comprehension'
                ? ' Afterwards we’ll ask a couple of quick questions so the estimate reflects real reading, not skimming.'
                : ''}
            </ThemedText>
            <Card>
              <SectionLabel>Passage</SectionLabel>
              <ThemedText variant="subheading">{passage.title}</ThemedText>
              <ThemedText muted variant="caption">
                {passage.wordCount} words
              </ThemedText>
            </Card>
            <Button title="Start reading" onPress={startReading} />
            <Button title="Skip for now" variant="ghost" onPress={done} />
          </>
        )}

        {phase === 'reading' && (
          <>
            <SectionLabel>Read at your natural pace</SectionLabel>
            <ThemedText variant="heading">{passage.title}</ThemedText>
            <ThemedText style={{ lineHeight: 24 }}>{passage.text}</ThemedText>
            <Button title="I’m done reading" onPress={finishReading} />
          </>
        )}

        {phase === 'questions' && (
          <>
            <ThemedText variant="title">Quick check</ThemedText>
            <ThemedText muted>Answer from memory — no peeking back.</ThemedText>
            {passage.questions.map((q, qi) => (
              <Card key={qi}>
                <ThemedText variant="subheading" style={{ marginBottom: theme.spacing.md }}>
                  {q.prompt}
                </ThemedText>
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  return (
                    <Pressable
                      key={oi}
                      onPress={() =>
                        setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                      }
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: theme.spacing.md,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: selected ? theme.colors.accent : theme.colors.border,
                        backgroundColor: selected ? theme.colors.accentMuted : 'transparent',
                        marginBottom: theme.spacing.sm,
                      }}
                    >
                      <ThemedText color={selected ? theme.colors.accent : undefined}>{opt}</ThemedText>
                    </Pressable>
                  );
                })}
              </Card>
            ))}
            <Button
              title="See my result"
              disabled={answers.some((a) => a == null)}
              onPress={() => setPhase('result')}
            />
          </>
        )}

        {phase === 'result' && (
          <>
            <ThemedText variant="title">Your reading speed</ThemedText>
            <Card style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
              <ThemedText variant="stat">{wpm}</ThemedText>
              <ThemedText muted>words per minute</ThemedText>
              {variant === 'comprehension' && (
                <>
                  <Divider />
                  <ThemedText muted>
                    Comprehension: {Math.round(comprehensionScore * 100)}%
                  </ThemedText>
                  {comprehensionScore < 0.6 && (
                    <ThemedText color={theme.colors.danger} variant="caption" style={{ marginTop: 6 }}>
                      That was a quick read — you can retake it any time from Settings for a truer pace.
                    </ThemedText>
                  )}
                </>
              )}
            </Card>
            <ThemedText muted>
              We’ll use this to estimate how long each book will take. You can retake the test whenever
              you like.
            </ThemedText>
            <Button title="Continue" loading={save.isPending} onPress={done} />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
