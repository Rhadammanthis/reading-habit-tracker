import {
  formatClock,
  formatMinutes,
  formatDaysEstimate,
  formatDate,
  daysBetween,
} from './format';

describe('formatClock', () => {
  it('formats minutes and seconds with zero padding', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(600)).toBe('10:00');
  });
  it('floors fractional seconds and clamps negatives to zero', () => {
    expect(formatClock(59.9)).toBe('0:59');
    expect(formatClock(-10)).toBe('0:00');
  });
});

describe('formatMinutes', () => {
  it('shows bare minutes under an hour', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(40)).toBe('40m');
    expect(formatMinutes(59)).toBe('59m');
  });
  it('shows hours and minutes at/over an hour', () => {
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(95)).toBe('1h 35m');
    expect(formatMinutes(120)).toBe('2h');
  });
  it('rounds to the nearest minute', () => {
    expect(formatMinutes(40.4)).toBe('40m');
    expect(formatMinutes(40.6)).toBe('41m');
  });
});

describe('formatDaysEstimate', () => {
  it('handles finished, singular, plural, and unknown', () => {
    expect(formatDaysEstimate(0)).toBe('Finished');
    expect(formatDaysEstimate(1)).toBe('1 day to go');
    expect(formatDaysEstimate(5)).toBe('5 days to go');
    expect(formatDaysEstimate(Infinity)).toBe('Set a goal to estimate');
  });
});

describe('daysBetween', () => {
  it('counts whole days, with a floor of 1', () => {
    expect(daysBetween('2026-06-01T00:00:00.000Z', '2026-06-04T00:00:00.000Z')).toBe(3);
    // same instant -> still counts as one reading day
    expect(daysBetween('2026-06-01T10:00:00.000Z', '2026-06-01T11:00:00.000Z')).toBe(1);
  });
});

describe('formatDate', () => {
  it('renders a date string including the year', () => {
    expect(formatDate('2026-06-19T12:00:00.000Z')).toContain('2026');
  });
});
