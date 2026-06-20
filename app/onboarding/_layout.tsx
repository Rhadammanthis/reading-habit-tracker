import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { useOnboarding } from '@/hooks/useProfile';
import { useTheme } from '@/theme/ThemeProvider';
import { isSupabaseConfigured } from '@/lib/env';
import { FullScreenLoader } from '@/components/ui';

/**
 * Gate + container for the first-run onboarding flow. A user only sees these
 * screens while their profile's onboarding_step is not 'done'. Once finished
 * (or if there's no session / backend), they're bounced out.
 */
export default function OnboardingLayout() {
  const theme = useTheme();
  const { session, initializing } = useAuth();
  const { ready, isComplete } = useOnboarding();

  // Without a backend there's no profile to track onboarding; let the app's
  // setup message handle it from the main stack.
  if (!isSupabaseConfigured) {
    return <Redirect href="/(tabs)" />;
  }
  if (initializing) {
    return <FullScreenLoader />;
  }
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  if (!ready) {
    return <FullScreenLoader />;
  }
  if (isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { color: theme.colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
        // Onboarding is linear and forward-only — no back button or swipe-back.
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="name" options={{ title: 'Welcome' }} />
      <Stack.Screen name="speed-test" options={{ title: 'Reading speed' }} />
      <Stack.Screen name="goal" options={{ title: 'Daily goal' }} />
      <Stack.Screen name="add-book" options={{ title: 'Your first book' }} />
    </Stack>
  );
}
