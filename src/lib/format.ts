/** mm:ss for a countdown/timer. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Human minutes, e.g. 95 -> "1h 35m", 40 -> "40m". */
export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

/** Estimated days to finish as a friendly phrase. */
export function formatDaysEstimate(days: number): string {
  if (!isFinite(days)) return 'Set a goal to estimate';
  if (days <= 0) return 'Finished';
  if (days === 1) return '1 day to go';
  return `${days} days to go`;
}

/** e.g. "Jun 19, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Whole days spanned between two ISO dates, minimum 1. */
export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}
