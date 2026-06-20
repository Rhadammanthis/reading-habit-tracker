/**
 * Pure onboarding-flow logic: the ordered steps a new user moves through and
 * how to advance between them. Kept framework-free so it can be unit tested and
 * reused by both the routing layer and the screens.
 */
import { OnboardingStep } from '@/types/models';

/** The steps in the order a user completes them, ending at the terminal 'done'. */
export const ONBOARDING_STEP_ORDER: OnboardingStep[] = [
  'name',
  'speed_test',
  'goal',
  'add_book',
  'done',
];

/** True once the user has finished every onboarding step. */
export function isOnboardingComplete(step: OnboardingStep | null | undefined): boolean {
  return step === 'done';
}

/**
 * The step that follows `step`. Unknown values are treated as the very start so
 * the user is never stranded; the last step advances to 'done'.
 */
export function nextOnboardingStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEP_ORDER.indexOf(step);
  if (index < 0) return ONBOARDING_STEP_ORDER[0];
  const next = ONBOARDING_STEP_ORDER[index + 1];
  return next ?? 'done';
}
