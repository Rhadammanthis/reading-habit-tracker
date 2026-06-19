import React from 'react';
import { Image, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/theme/ThemeProvider';

/** Book cover image with a themed placeholder when no artwork is available. */
export function BookCover({
  uri,
  width = 56,
  height,
}: {
  uri?: string | null;
  width?: number;
  height?: number;
}) {
  const theme = useTheme();
  const h = height ?? Math.round(width * 1.5);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width, height: h, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceAlt }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width,
        height: h,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="book" size={width * 0.4} color={theme.colors.textMuted} />
    </View>
  );
}
