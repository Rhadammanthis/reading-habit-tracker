import {
  ONBOARDING_STEP_ORDER,
  isOnboardingComplete,
  nextOnboardingStep,
} from './onboarding';

describe('isOnboardingComplete', () => {
  it('is true only for the terminal step', () => {
    expect(isOnboardingComplete('done')).toBe(true);
    expect(isOnboardingComplete('name')).toBe(false);
    expect(isOnboardingComplete('speed_test')).toBe(false);
    expect(isOnboardingComplete('goal')).toBe(false);
    expect(isOnboardingComplete('add_book')).toBe(false);
  });

  it('treats missing state as not complete', () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete(undefined)).toBe(false);
  });
});

describe('nextOnboardingStep', () => {
  it('walks the steps in order', () => {
    expect(nextOnboardingStep('name')).toBe('speed_test');
    expect(nextOnboardingStep('speed_test')).toBe('goal');
    expect(nextOnboardingStep('goal')).toBe('add_book');
    expect(nextOnboardingStep('add_book')).toBe('done');
  });

  it('stays at done once finished', () => {
    expect(nextOnboardingStep('done')).toBe('done');
  });

  it('covers every non-terminal step in the canonical order', () => {
    for (let i = 0; i < ONBOARDING_STEP_ORDER.length - 1; i += 1) {
      expect(nextOnboardingStep(ONBOARDING_STEP_ORDER[i])).toBe(
        ONBOARDING_STEP_ORDER[i + 1],
      );
    }
  });
});
