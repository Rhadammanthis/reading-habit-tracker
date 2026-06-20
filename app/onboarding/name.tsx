import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer, ThemedText, Button, SectionLabel } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useProfile, useOnboarding } from '@/hooks/useProfile';

/**
 * First onboarding step (only reached when a name wasn't captured at sign-up):
 * ask what to call the reader, then move on to the speed test.
 */
export default function OnboardingName() {
  const theme = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { advanceTo } = useOnboarding();

  const [name, setName] = useState(profile?.display_name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function continueNext() {
    if (!name.trim()) {
      setError('Enter your name so we can personalize things.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await advanceTo('speed_test', { display_name: name.trim() });
      router.replace('/onboarding/speed-test');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: theme.spacing.xl, gap: theme.spacing.lg }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <ThemedText variant="title">Welcome 👋</ThemedText>
          <ThemedText muted>
            Let’s set up your reading habit. First — what should we call you?
          </ThemedText>
        </View>

        <View>
          <SectionLabel>Your name</SectionLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={continueNext}
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
          />
          {error ? (
            <ThemedText color={theme.colors.danger} style={{ marginTop: theme.spacing.sm }}>
              {error}
            </ThemedText>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />
        <Button title="Continue" loading={saving} onPress={continueNext} />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
