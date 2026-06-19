import {
  wordsForBook,
  remainingWords,
  progressFraction,
  estimateMinutesToFinish,
  estimateDaysToFinish,
  wordsReadFromMinutes,
  pageFromWords,
  wordsFromPage,
} from './estimation';

describe('wordsForBook', () => {
  it('multiplies pages by words-per-page', () => {
    expect(wordsForBook(300, 275)).toBe(82500);
  });
  it('uses the default factor when omitted', () => {
    expect(wordsForBook(100)).toBe(27500);
  });
  it('returns 0 for non-positive inputs', () => {
    expect(wordsForBook(0, 275)).toBe(0);
    expect(wordsForBook(100, 0)).toBe(0);
  });
});

describe('remainingWords', () => {
  it('returns the gap to the total', () => {
    expect(remainingWords({ wordCountEstimate: 1000, currentWord: 300 })).toBe(700);
  });
  it('never goes negative', () => {
    expect(remainingWords({ wordCountEstimate: 1000, currentWord: 1500 })).toBe(0);
  });
});

describe('progressFraction', () => {
  it('computes a clamped fraction', () => {
    expect(progressFraction({ wordCountEstimate: 1000, currentWord: 250 })).toBe(0.25);
    expect(progressFraction({ wordCountEstimate: 1000, currentWord: 5000 })).toBe(1);
  });
  it('handles a zero-length book', () => {
    expect(progressFraction({ wordCountEstimate: 0, currentWord: 0 })).toBe(0);
  });
});

describe('estimateMinutesToFinish', () => {
  it('divides remaining words by speed', () => {
    expect(estimateMinutesToFinish({ remainingWords: 2000, wpm: 200 })).toBe(10);
  });
  it('guards divide-by-zero speed', () => {
    expect(estimateMinutesToFinish({ remainingWords: 2000, wpm: 0 })).toBe(0);
  });
});

describe('estimateDaysToFinish', () => {
  it('rounds partial days up', () => {
    // 8250 words at 275 wpm = 30 min; 20 min/day -> 2 days
    expect(estimateDaysToFinish({ remainingWords: 8250, wpm: 275, goalMinutesPerDay: 20 })).toBe(2);
  });
  it('returns 0 when nothing remains', () => {
    expect(estimateDaysToFinish({ remainingWords: 0, wpm: 275, goalMinutesPerDay: 20 })).toBe(0);
  });
  it('returns Infinity for impossible budgets', () => {
    expect(estimateDaysToFinish({ remainingWords: 100, wpm: 0, goalMinutesPerDay: 20 })).toBe(Infinity);
    expect(estimateDaysToFinish({ remainingWords: 100, wpm: 200, goalMinutesPerDay: 0 })).toBe(Infinity);
  });
});

describe('word/page conversions', () => {
  it('wordsReadFromMinutes', () => {
    expect(wordsReadFromMinutes(10, 200)).toBe(2000);
    expect(wordsReadFromMinutes(0, 200)).toBe(0);
  });
  it('pageFromWords and wordsFromPage round-trip approximately', () => {
    expect(wordsFromPage(10, 275)).toBe(2750);
    expect(pageFromWords(2750, 275)).toBe(10);
  });
});
