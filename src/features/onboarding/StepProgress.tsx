import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A compact "step N of total" indicator: a row of pills with the current and
 * completed steps filled. Used across the onboarding screens for orientation.
 */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: i < step ? theme.colors.accent : theme.colors.border,
            }}
          />
        ))}
      </View>
      <ThemedText variant="caption" muted>
        Step {step} of {total}
      </ThemedText>
    </View>
  );
}
