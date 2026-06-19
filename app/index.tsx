import React from 'react';
import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { isSupabaseConfigured } from '@/lib/env';
import { FullScreenLoader } from '@/components/ui';

/** Entry route: send the user to the app or to sign-in based on session. */
export default function Index() {
  const { initializing, session } = useAuth();

  if (!isSupabaseConfigured) {
    // Let the app render so the in-app setup message is reachable.
    return <Redirect href="/(tabs)" />;
  }
  if (initializing) {
    return <FullScreenLoader />;
  }
  return <Redirect href={session ? '/(tabs)' : '/(auth)/sign-in'} />;
}
