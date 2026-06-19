import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/** Full-screen container that paints the themed background and respects insets. */
export function ScreenContainer({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

type Variant = keyof ReturnType<typeof useTheme>['typography'];

export function ThemedText({
  variant = 'body',
  color,
  muted,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string; muted?: boolean }) {
  const theme = useTheme();
  const resolved = color ?? (muted ? theme.colors.textMuted : theme.colors.text);
  return (
    <Text
      {...rest}
      style={[theme.typography[variant] as TextStyle, { color: resolved }, style]}
    />
  );
}

export function Card({ style, children, ...rest }: ViewProps & { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...rest
}: PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? theme.colors.accent
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'secondary'
          ? theme.colors.surfaceAlt
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.onAccent
      : variant === 'secondary'
        ? theme.colors.text
        : theme.colors.accent;

  return (
    <Pressable
      {...rest}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: theme.radius.md,
          paddingVertical: 14,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
        },
        style as StyleProp<ViewStyle>,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[theme.typography.subheading, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

/** Small uppercase section label. */
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography.label,
        { color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: theme.spacing.sm },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Divider() {
  const theme = useTheme();
  return (
    <View
      style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md }}
    />
  );
}

export function CenteredMessage({ title, message }: { title: string; message?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: 8 }}>
      <ThemedText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText muted style={{ textAlign: 'center' }}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function FullScreenLoader() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
    </View>
  );
}
