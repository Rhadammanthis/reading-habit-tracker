import { useTimerStore, elapsedSeconds } from './timerStore';

function setNow(ms: number) {
  jest.spyOn(Date, 'now').mockReturnValue(ms);
}

describe('timerStore', () => {
  beforeEach(() => {
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts a session in the running state', () => {
    setNow(1_000_000);
    useTimerStore.getState().start({ bookId: 'b1', goalSeconds: 600, notificationId: 'n1' });

    const s = useTimerStore.getState();
    expect(s.status).toBe('running');
    expect(s.bookId).toBe('b1');
    expect(s.goalSeconds).toBe(600);
    expect(s.notificationId).toBe('n1');
    expect(s.sessionStartedAtISO).not.toBeNull();
    expect(s.accumulatedSeconds).toBe(0);
  });

  it('accumulates elapsed time across pause/resume', () => {
    setNow(0);
    useTimerStore.getState().start({ bookId: 'b1', goalSeconds: 600, notificationId: null });

    // 30s later, pause
    setNow(30_000);
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().status).toBe('paused');
    expect(elapsedSeconds(useTimerStore.getState())).toBe(30);

    // time passes while paused — elapsed should not move
    setNow(90_000);
    expect(elapsedSeconds(useTimerStore.getState())).toBe(30);

    // resume and run another 10s
    useTimerStore.getState().resume();
    setNow(100_000);
    expect(useTimerStore.getState().status).toBe('running');
    expect(elapsedSeconds(useTimerStore.getState())).toBe(40);
  });

  it('finish captures the in-progress segment', () => {
    setNow(0);
    useTimerStore.getState().start({ bookId: 'b1', goalSeconds: 600, notificationId: null });
    setNow(45_000);
    useTimerStore.getState().finish();

    const s = useTimerStore.getState();
    expect(s.status).toBe('finished');
    expect(Math.round(s.accumulatedSeconds)).toBe(45);
    expect(elapsedSeconds(s)).toBe(45);
  });

  it('reset returns to the idle baseline', () => {
    setNow(0);
    useTimerStore.getState().start({ bookId: 'b1', goalSeconds: 600, notificationId: 'n1' });
    useTimerStore.getState().reset();

    const s = useTimerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.bookId).toBeNull();
    expect(s.goalSeconds).toBe(0);
    expect(s.notificationId).toBeNull();
    expect(elapsedSeconds(s)).toBe(0);
  });

  it('pause is a no-op when not running', () => {
    useTimerStore.getState().reset();
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().status).toBe('idle');
  });
});
