import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/auth/AuthProvider';
import { fetchLatestSpeedTest, insertSpeedTest } from '@/services/speedTests';
import { DEFAULT_WPM, SpeedTestVariant } from '@/types/models';
import { queryKeys } from './queryKeys';

/** Latest speed test for the user (null until they take one). */
export function useLatestSpeedTest() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: queryKeys.latestSpeedTest(userId ?? 'anon'),
    queryFn: () => fetchLatestSpeedTest(userId as string),
    enabled: !!userId,
  });
}

/** Convenience: the WPM to use for estimates, falling back to a sane default. */
export function useEffectiveWpm(): number {
  const { data } = useLatestSpeedTest();
  return data?.wpm ?? DEFAULT_WPM;
}

export function useSaveSpeedTest() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { wpm: number; variant: SpeedTestVariant; comprehensionScore?: number | null }) =>
      insertSpeedTest({ userId: userId as string, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.latestSpeedTest(userId ?? 'anon') });
    },
  });
}
