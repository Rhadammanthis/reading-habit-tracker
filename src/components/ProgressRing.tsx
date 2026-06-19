import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from './ui';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Circular progress indicator showing the share of a book that's been read.
 * `progress` is 0..1.
 */
export function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 14,
  label,
  caption,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  caption?: string;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          fill="none"
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <ThemedText variant="stat">{label ?? `${Math.round(clamped * 100)}%`}</ThemedText>
        {caption ? (
          <ThemedText variant="caption" muted>
            {caption}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
