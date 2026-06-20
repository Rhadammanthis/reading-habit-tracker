import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ui';
import { AddBookFlow } from '@/features/addBook/AddBookFlow';
import { StepProgress } from '@/features/onboarding/StepProgress';
import { useOnboarding } from '@/hooks/useProfile';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Onboarding step 3 (final): add the book you're currently reading and start it,
 * which completes onboarding and drops you into the app ready for a session.
 */
export default function OnboardingAddBook() {
  const theme = useTheme();
  const router = useRouter();
  const { advanceTo } = useOnboarding();
  const [finishing, setFinishing] = useState(false);

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    try {
      await advanceTo('done');
    } finally {
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.sm,
        }}
      >
        <StepProgress step={3} total={3} />
        <ThemedText variant="title">Add your current book</ThemedText>
        <ThemedText muted>
          Search for the book you’re reading now. We’ll start it so you can jump into a session.
        </ThemedText>
      </View>
      <View style={{ flex: 1 }}>
        {/* Only the start-now path here, so onboarding ends with a current book. */}
        <AddBookFlow hideAddToList onAdded={finish} />
      </View>
    </View>
  );
}
