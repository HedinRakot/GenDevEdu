import { DAILY_CHALLENGES, pickDailyChallenge } from '@/data/dailyChallenges';

describe('pickDailyChallenge', () => {
  it('returns the same challenge for the same date', () => {
    const a = pickDailyChallenge(new Date('2026-05-08T00:00:00Z'));
    const b = pickDailyChallenge(new Date('2026-05-08T23:59:59Z'));
    expect(a.id).toBe(b.id);
  });

  it('cycles deterministically through the pool', () => {
    const ids = new Set<string>();
    for (let day = 0; day < DAILY_CHALLENGES.length; day++) {
      const date = new Date(2026, 0, 1 + day);
      ids.add(pickDailyChallenge(date).id);
    }
    expect(ids.size).toBe(DAILY_CHALLENGES.length);
  });

  it('always returns a non-empty challenge', () => {
    const challenge = pickDailyChallenge();
    expect(challenge.id).toBeTruthy();
    expect(challenge.title.items.length).toBeGreaterThan(0);
    expect(challenge.estimatedMinutes).toBeGreaterThan(0);
  });
});
