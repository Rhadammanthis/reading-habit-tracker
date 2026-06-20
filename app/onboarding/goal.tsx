import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer, ThemedText, Button, SectionLabel } from '@/components/ui';
import { StepProgress } from '@/features/onboarding/StepProgress';
import { useTheme } from '@/theme/ThemeProvider';
import { useProfile, useOnboarding } from '@/hooks/useProfile';
import { DEFAULT_GOAL_MINUTES } from '@/types/models';

const GOAL_PRESETS = [10, 15, 20, 30, 45];

/**
 * Onboarding step 2: pick an initial daily reading goal. Saved as the profile
 * default so new books start with it pre-filled.
 */
export default function OnboardingGoal() {
  const theme = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { advanceTo } = useOnboarding();

  const [goal, setGoal] = useState<number>(profile?.default_goal_minutes ?? DEFAULT_GOAL_MINUTES);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function continueNext() {
    setError(null);
    setSaving(true);
    try {
      await advanceTo('add_book', { default_goal_minutes: goal });
      router.replace('/onboarding/add-book');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <StepProgress step={2} total={3} />
        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="title">Set a daily goal</ThemedText>
          <ThemedText muted>
            How many minutes a day feels doable? Small and steady wins — you can change this anytime.
          </ThemedText>
        </View>

        <View>
          <SectionLabel>Minutes per day</SectionLabel>
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
          {error ? (
            <ThemedText color={theme.colors.danger} style={{ marginTop: theme.spacing.sm }}>
              {error}
            </ThemedText>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />
        <Button title="Continue" loading={saving} onPress={continueNext} />
      </View>
    </ScreenContainer>
  );
}
