import { SpeedTestVariant } from '@/types/models';

/**
 * Which speed-test variant to show. Both variants are fully implemented; this
 * flag selects the active one so it can be wired to an A/B experiment later
 * (e.g. assign by user id hash). For now it's a single constant.
 */
export const SPEED_TEST_VARIANT: SpeedTestVariant = 'comprehension';

/** Words-per-minute computed from a passage read in `elapsedMs`. */
export function computeWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return Math.round(wordCount / minutes);
}

/** Reasonable bounds so a mis-tap doesn't store a wild value. */
export const MIN_PLAUSIBLE_WPM = 50;
export const MAX_PLAUSIBLE_WPM = 1200;

export function clampWpm(wpm: number): number {
  return Math.max(MIN_PLAUSIBLE_WPM, Math.min(MAX_PLAUSIBLE_WPM, wpm));
}
