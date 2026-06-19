import { PASSAGES, pickPassage } from './passages';

describe('passage data integrity', () => {
  it('has at least one passage', () => {
    expect(PASSAGES.length).toBeGreaterThan(0);
  });

  it('each passage has a positive declared word count', () => {
    for (const p of PASSAGES) {
      expect(p.wordCount).toBeGreaterThan(0);
    }
  });

  it('declared word count is within ~10% of the actual text length', () => {
    for (const p of PASSAGES) {
      const actual = p.text.trim().split(/\s+/).length;
      const ratio = actual / p.wordCount;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    }
  });

  it('every comprehension answer index points to a real option', () => {
    for (const p of PASSAGES) {
      expect(p.questions.length).toBeGreaterThan(0);
      for (const q of p.questions) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });
});

describe('pickPassage', () => {
  it('rotates through passages by index', () => {
    expect(pickPassage(0)).toBe(PASSAGES[0]);
    expect(pickPassage(PASSAGES.length)).toBe(PASSAGES[0]);
    expect(pickPassage(1)).toBe(PASSAGES[1 % PASSAGES.length]);
  });
});
