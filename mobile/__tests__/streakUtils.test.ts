import {
  computeNextStreak,
  dayDiff,
  isStreakStillValid,
  toDateKey,
  type StreakState,
} from '@/utils/streakUtils';

const empty: StreakState = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

const at = (iso: string) => new Date(`${iso}T12:00:00`);

describe('toDateKey', () => {
  it('formats date as YYYY-MM-DD using local components', () => {
    expect(toDateKey(new Date('2026-05-08T08:30:00'))).toBe('2026-05-08');
  });
});

describe('dayDiff', () => {
  it('returns 1 for consecutive days', () => {
    expect(dayDiff('2026-05-07', '2026-05-08')).toBe(1);
  });
  it('returns 0 for same day', () => {
    expect(dayDiff('2026-05-08', '2026-05-08')).toBe(0);
  });
  it('handles month boundary', () => {
    expect(dayDiff('2026-04-30', '2026-05-01')).toBe(1);
  });
});

describe('computeNextStreak', () => {
  it('starts a streak from scratch', () => {
    const next = computeNextStreak(empty, at('2026-05-08'));
    expect(next).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: '2026-05-08',
    });
  });

  it('does not double-count the same day', () => {
    const previous: StreakState = {
      currentStreak: 5,
      longestStreak: 7,
      lastActiveDate: '2026-05-08',
    };
    const next = computeNextStreak(previous, at('2026-05-08'));
    expect(next).toBe(previous); // gleiches Objekt → keine Schreiboperation
  });

  it('increments on consecutive day', () => {
    const previous: StreakState = {
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: '2026-05-07',
    };
    const next = computeNextStreak(previous, at('2026-05-08'));
    expect(next.currentStreak).toBe(4);
    expect(next.longestStreak).toBe(5); // bisheriger Rekord bleibt
  });

  it('updates longest streak when current beats record', () => {
    const previous: StreakState = {
      currentStreak: 7,
      longestStreak: 7,
      lastActiveDate: '2026-05-07',
    };
    const next = computeNextStreak(previous, at('2026-05-08'));
    expect(next.currentStreak).toBe(8);
    expect(next.longestStreak).toBe(8);
  });

  it('resets to 1 when a day is skipped', () => {
    const previous: StreakState = {
      currentStreak: 12,
      longestStreak: 20,
      lastActiveDate: '2026-05-05',
    };
    const next = computeNextStreak(previous, at('2026-05-08'));
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(20);
  });
});

describe('computeNextStreak – default now parameter', () => {
  it('uses current date when now is omitted', () => {
    const result = computeNextStreak(empty);
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isStreakStillValid', () => {
  it('valid when active today', () => {
    expect(
      isStreakStillValid(
        { currentStreak: 4, longestStreak: 4, lastActiveDate: '2026-05-08' },
        at('2026-05-08'),
      ),
    ).toBe(true);
  });

  it('valid when active yesterday', () => {
    expect(
      isStreakStillValid(
        { currentStreak: 4, longestStreak: 4, lastActiveDate: '2026-05-07' },
        at('2026-05-08'),
      ),
    ).toBe(true);
  });

  it('invalid when more than a day has passed', () => {
    expect(
      isStreakStillValid(
        { currentStreak: 4, longestStreak: 4, lastActiveDate: '2026-05-05' },
        at('2026-05-08'),
      ),
    ).toBe(false);
  });

  it('invalid when never active', () => {
    expect(isStreakStillValid(empty, at('2026-05-08'))).toBe(false);
  });

  it('uses current date when now is omitted', () => {
    expect(isStreakStillValid(empty)).toBe(false);
  });
});
