import { computeWpm, clampWpm, MIN_PLAUSIBLE_WPM, MAX_PLAUSIBLE_WPM } from './config';

describe('computeWpm', () => {
  it('computes words per minute from elapsed time', () => {
    // 220 words in 60s -> 220 wpm
    expect(computeWpm(220, 60_000)).toBe(220);
    // 220 words in 30s -> 440 wpm
    expect(computeWpm(220, 30_000)).toBe(440);
  });
  it('rounds to a whole number', () => {
    expect(computeWpm(100, 45_000)).toBe(133);
  });
  it('guards zero/negative elapsed time', () => {
    expect(computeWpm(220, 0)).toBe(0);
    expect(computeWpm(220, -5)).toBe(0);
  });
});

describe('clampWpm', () => {
  it('keeps plausible values untouched', () => {
    expect(clampWpm(250)).toBe(250);
  });
  it('clamps implausible extremes', () => {
    expect(clampWpm(5)).toBe(MIN_PLAUSIBLE_WPM);
    expect(clampWpm(99_999)).toBe(MAX_PLAUSIBLE_WPM);
  });
});
