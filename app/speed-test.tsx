import React from 'react';
import { useRouter } from 'expo-router';

import { SpeedTestRunner } from '@/features/speedTest/SpeedTestRunner';

/** Retake the reading-speed test on demand (from Settings or the Today nudge). */
export default function SpeedTestScreen() {
  const router = useRouter();
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };
  return <SpeedTestRunner onDone={leave} />;
}
