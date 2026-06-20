import React from 'react';
import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { useOnboarding } from '@/hooks/useProfile';
import { isSupabaseConfigured } from '@/lib/env';
import { FullScreenLoader } from '@/components/ui';

/**
 * Entry route: send the user to sign-in, into onboarding, or to the app,
 * depending on session and how far they've gotten through onboarding.
 */
export default function Index() {
  const { initializing, session } = useAuth();
  const { ready, isComplete } = useOnboarding();

  if (!isSupabaseConfigured) {
    // Let the app render so the in-app setup message is reachable.
    return <Redirect href="/(tabs)" />;
  }
  if (initializing) {
    return <FullScreenLoader />;
  }
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  // Signed in — wait for the profile so we know whether onboarding is done.
  if (!ready) {
    return <FullScreenLoader />;
  }
  return <Redirect href={isComplete ? '/(tabs)' : '/onboarding'} />;
}
