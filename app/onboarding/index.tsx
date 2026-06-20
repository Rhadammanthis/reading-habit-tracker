import React from 'react';
import { Redirect } from 'expo-router';

import { useOnboarding } from '@/hooks/useProfile';
import { FullScreenLoader } from '@/components/ui';

/**
 * Onboarding entry point: send the user to whichever step they still need to
 * complete. This is what makes the flow resumable — on a cold start we read the
 * persisted step and jump straight back to it.
 */
export default function OnboardingIndex() {
  const { ready, step } = useOnboarding();

  if (!ready) {
    return <FullScreenLoader />;
  }

  switch (step) {
    case 'name':
      return <Redirect href="/onboarding/name" />;
    case 'speed_test':
      return <Redirect href="/onboarding/speed-test" />;
    case 'goal':
      return <Redirect href="/onboarding/goal" />;
    case 'add_book':
      return <Redirect href="/onboarding/add-book" />;
    default:
      return <Redirect href="/(tabs)" />;
  }
}
