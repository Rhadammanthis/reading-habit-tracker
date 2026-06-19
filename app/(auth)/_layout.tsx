import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { isSupabaseConfigured } from '@/lib/env';

export default function AuthLayout() {
  const { session } = useAuth();

  // Already signed in -> bounce to the app.
  if (isSupabaseConfigured && session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
