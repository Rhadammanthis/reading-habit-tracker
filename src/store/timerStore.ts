import { create } from 'zustand';

/**
 * Live reading-session timer. Time is derived from wall-clock timestamps rather
 * than a tick counter, so elapsed stays correct even if the app is backgrounded
 * or the user navigates away and back.
 */

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

type TimerState = {
  status: TimerStatus;
  bookId: string | null;
  goalSeconds: number;
  /** Whole seconds accumulated in completed run segments. */
  accumulatedSeconds: number;
  /** Epoch ms when the current running segment began (null when not running). */
  segmentStartedAt: number | null;
  /** ISO timestamp of when the whole session started. */
  sessionStartedAtISO: string | null;
  /** Scheduled "goal reached" notification id, if any. */
  notificationId: string | null;

  start: (args: { bookId: string; goalSeconds: number; notificationId: string | null }) => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  reset: () => void;
  setNotificationId: (id: string | null) => void;
};

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  bookId: null,
  goalSeconds: 0,
  accumulatedSeconds: 0,
  segmentStartedAt: null,
  sessionStartedAtISO: null,
  notificationId: null,

  start: ({ bookId, goalSeconds, notificationId }) =>
    set({
      status: 'running',
      bookId,
      goalSeconds,
      accumulatedSeconds: 0,
      segmentStartedAt: Date.now(),
      sessionStartedAtISO: new Date().toISOString(),
      notificationId,
    }),

  pause: () => {
    const { status, segmentStartedAt, accumulatedSeconds } = get();
    if (status !== 'running' || segmentStartedAt == null) return;
    const extra = (Date.now() - segmentStartedAt) / 1000;
    set({ status: 'paused', accumulatedSeconds: accumulatedSeconds + extra, segmentStartedAt: null });
  },

  resume: () => {
    if (get().status !== 'paused') return;
    set({ status: 'running', segmentStartedAt: Date.now() });
  },

  finish: () => {
    const { status, segmentStartedAt, accumulatedSeconds } = get();
    const extra = status === 'running' && segmentStartedAt != null ? (Date.now() - segmentStartedAt) / 1000 : 0;
    set({ status: 'finished', accumulatedSeconds: accumulatedSeconds + extra, segmentStartedAt: null });
  },

  reset: () =>
    set({
      status: 'idle',
      bookId: null,
      goalSeconds: 0,
      accumulatedSeconds: 0,
      segmentStartedAt: null,
      sessionStartedAtISO: null,
      notificationId: null,
    }),

  setNotificationId: (id) => set({ notificationId: id }),
}));

/** Current elapsed seconds, derived from the store's timestamps. */
export function elapsedSeconds(state: Pick<TimerState, 'accumulatedSeconds' | 'segmentStartedAt' | 'status'>): number {
  const live = state.status === 'running' && state.segmentStartedAt != null
    ? (Date.now() - state.segmentStartedAt) / 1000
    : 0;
  return Math.floor(state.accumulatedSeconds + live);
}
