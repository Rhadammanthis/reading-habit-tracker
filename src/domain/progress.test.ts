import { applySession, BookProgressState } from './progress';

const baseBook: BookProgressState = {
  pageCount: 300,
  wordCountEstimate: 82500, // 300 * 275
  currentPage: 0,
  currentWord: 0,
  wordsPerPage: 275,
};

describe('applySession - estimate mode', () => {
  it('advances by words read at the tested speed', () => {
    const result = applySession(baseBook, {
      mode: 'estimate',
      durationSeconds: 600, // 10 min
      wpm: 275,
    });
    // 10 min * 275 = 2750 words = 10 pages
    expect(result.wordsRead).toBe(2750);
    expect(result.currentWord).toBe(2750);
    expect(result.currentPage).toBe(10);
    expect(result.completed).toBe(false);
  });

  it('caps at the book length and marks completion', () => {
    const almostDone = { ...baseBook, currentPage: 295, currentWord: 81000 };
    const result = applySession(almostDone, {
      mode: 'estimate',
      durationSeconds: 36000, // way more than needed
      wpm: 275,
    });
    expect(result.completed).toBe(true);
    expect(result.currentPage).toBe(300);
    expect(result.currentWord).toBe(82500);
    expect(result.wordsRead).toBe(1500);
  });
});

describe('applySession - manual mode', () => {
  it('jumps to the reported page', () => {
    const result = applySession(baseBook, {
      mode: 'manual',
      durationSeconds: 600,
      wpm: 275,
      manualPage: 50,
    });
    expect(result.currentPage).toBe(50);
    expect(result.currentWord).toBe(50 * 275);
    expect(result.pagesRead).toBe(50);
    expect(result.completed).toBe(false);
  });

  it('reaching the last page completes the book exactly', () => {
    const result = applySession(baseBook, {
      mode: 'manual',
      durationSeconds: 600,
      wpm: 275,
      manualPage: 300,
    });
    expect(result.completed).toBe(true);
    expect(result.currentWord).toBe(82500);
  });

  it('clamps a page beyond the book length', () => {
    const result = applySession(baseBook, {
      mode: 'manual',
      durationSeconds: 600,
      wpm: 275,
      manualPage: 999,
    });
    expect(result.currentPage).toBe(300);
    expect(result.completed).toBe(true);
  });

  it('never regresses when the reported page is behind current', () => {
    const midway = { ...baseBook, currentPage: 100, currentWord: 27500 };
    const result = applySession(midway, {
      mode: 'manual',
      durationSeconds: 600,
      wpm: 275,
      manualPage: 40,
    });
    expect(result.currentPage).toBe(100);
    expect(result.currentWord).toBe(27500);
    expect(result.pagesRead).toBe(0);
    expect(result.wordsRead).toBe(0);
  });
});
