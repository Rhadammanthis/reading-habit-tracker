import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ScreenContainer,
  ThemedText,
  Button,
  Card,
  SectionLabel,
  Divider,
} from '@/components/ui';
import { useTheme, useThemePref, ThemePref } from '@/theme/ThemeProvider';
import { useAuth } from '@/auth/AuthProvider';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useLatestSpeedTest } from '@/hooks/useSpeedTest';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { DEFAULT_GOAL_MINUTES, DEFAULT_WORDS_PER_PAGE } from '@/types/models';

const GOAL_PRESETS = [10, 15, 20, 30, 45];
const REMINDER_TIMES = [
  { label: 'Morning', hour: 8 },
  { label: 'Midday', hour: 12 },
  { label: 'Evening', hour: 19 },
  { label: 'Night', hour: 21 },
];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: on ? theme.colors.accent : theme.colors.border,
        backgroundColor: on ? theme.colors.accentMuted : 'transparent',
      }}
    >
      <ThemedText color={on ? theme.colors.accent : undefined}>{label}</ThemedText>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const { pref, setPref } = useThemePref();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: speedTest } = useLatestSpeedTest();
  const reminder = useDailyReminder();

  const [wppText, setWppText] = useState<string>(
    String(profile?.words_per_page ?? DEFAULT_WORDS_PER_PAGE),
  );

  const goal = profile?.default_goal_minutes ?? DEFAULT_GOAL_MINUTES;

  function saveWordsPerPage() {
    const v = parseInt(wppText, 10);
    if (v && v > 0) updateProfile.mutate({ words_per_page: v });
  }

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        {/* Appearance */}
        <Card>
          <SectionLabel>Appearance</SectionLabel>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['system', 'light', 'dark'] as ThemePref[]).map((p) => (
              <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} on={pref === p} onPress={() => setPref(p)} />
            ))}
          </View>
        </Card>

        {/* Reading defaults */}
        <Card>
          <SectionLabel>Default daily goal</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {GOAL_PRESETS.map((m) => (
              <Chip
                key={m}
                label={`${m} min`}
                on={goal === m}
                onPress={() => updateProfile.mutate({ default_goal_minutes: m })}
              />
            ))}
          </View>
          <Divider />
          <SectionLabel>Words per page</SectionLabel>
          <ThemedText variant="caption" muted style={{ marginBottom: theme.spacing.sm }}>
            Used to estimate word counts when a book only reports pages.
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <TextInput
              value={wppText}
              onChangeText={setWppText}
              onBlur={saveWordsPerPage}
              keyboardType="number-pad"
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: 10,
                color: theme.colors.text,
                fontSize: 16,
              }}
            />
            <Button title="Save" variant="secondary" onPress={saveWordsPerPage} />
          </View>
        </Card>

        {/* Reading speed */}
        <Card>
          <SectionLabel>Reading speed</SectionLabel>
          <ThemedText variant="subheading">
            {speedTest ? `${speedTest.wpm} words/min` : 'Not measured yet'}
          </ThemedText>
          <Button
            title={speedTest ? 'Retake speed test' : 'Take speed test'}
            variant="ghost"
            style={{ marginTop: theme.spacing.sm }}
            onPress={() => router.push('/onboarding/speed-test')}
          />
        </Card>

        {/* Notifications */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
              <ThemedText variant="subheading">Daily reminder</ThemedText>
              <ThemedText variant="caption" muted>
                A gentle nudge to start a reading session.
              </ThemedText>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={(v) => {
                if (v) reminder.enable(reminder.hour);
                else reminder.disable();
              }}
              trackColor={{ true: theme.colors.accent }}
            />
          </View>
          {reminder.enabled && (
            <>
              <Divider />
              <SectionLabel>Remind me at</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {REMINDER_TIMES.map((t) => (
                  <Chip
                    key={t.hour}
                    label={t.label}
                    on={reminder.hour === t.hour}
                    onPress={() => reminder.enable(t.hour)}
                  />
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Account */}
        <Button title="Sign out" variant="danger" onPress={signOut} />
      </ScrollView>
    </ScreenContainer>
  );
}
