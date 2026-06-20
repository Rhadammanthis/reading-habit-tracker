import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { SpeedTestRunner } from '@/features/speedTest/SpeedTestRunner';
import { StepProgress } from '@/features/onboarding/StepProgress';
import { useOnboarding } from '@/hooks/useProfile';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Onboarding step 1: the reading speed test. It's recommended but optional —
 * either finishing it or skipping advances to the daily-goal step.
 */
export default function OnboardingSpeedTest() {
  const theme = useTheme();
  const router = useRouter();
  const { advanceTo } = useOnboarding();
  const [leaving, setLeaving] = useState(false);

  async function next() {
    if (leaving) return;
    setLeaving(true);
    try {
      await advanceTo('goal');
    } finally {
      router.replace('/onboarding/goal');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg }}>
        <StepProgress step={1} total={3} />
      </View>
      <View style={{ flex: 1 }}>
        <SpeedTestRunner
          onDone={next}
          skipLabel="Skip for now"
          continueLabel="Continue"
        />
      </View>
    </View>
  );
}
