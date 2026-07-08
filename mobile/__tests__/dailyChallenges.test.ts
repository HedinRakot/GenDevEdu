import {
  DAILY_CHALLENGES,
  pickDailyChallenge,
  type ChallengeDifficulty,
  type ChallengeCategory,
} from '@/data/dailyChallenges';

const DAY_MS = 86_400_000;

describe('pickDailyChallenge', () => {
  it('returns the same challenge for the same calendar day', () => {
    const a = pickDailyChallenge(new Date(2026, 4, 8, 0, 0, 0));
    const b = pickDailyChallenge(new Date(2026, 4, 8, 23, 59, 59));
    expect(a.id).toBe(b.id);
  });

  it('is deterministic across separate calls', () => {
    const date = new Date(2026, 0, 15);
    expect(pickDailyChallenge(date).id).toBe(pickDailyChallenge(date).id);
  });

  it('shows every challenge in the pool over enough days (full permutation cycles)', () => {
    const seen = new Set<string>();
    const base = new Date(2026, 0, 1);
    // Über mehrere Zyklen hinweg muss jede Challenge mindestens einmal drankommen.
    for (let d = 0; d < DAILY_CHALLENGES.length * 4; d++) {
      seen.add(pickDailyChallenge(new Date(base.getTime() + d * DAY_MS)).id);
    }
    expect(seen.size).toBe(DAILY_CHALLENGES.length);
  });

  it('does not repeat the same challenge on consecutive days within a cycle', () => {
    const base = new Date(2026, 2, 1);
    let prev = pickDailyChallenge(base).id;
    let repeats = 0;
    for (let d = 1; d < DAILY_CHALLENGES.length; d++) {
      const id = pickDailyChallenge(new Date(base.getTime() + d * DAY_MS)).id;
      if (id === prev) repeats++;
      prev = id;
    }
    // Innerhalb eines Zyklus (Permutation) darf es keine direkte Wiederholung geben;
    // ein einzelner Zyklusübergang im Fenster ist möglich, daher <= 1.
    expect(repeats).toBeLessThanOrEqual(1);
  });

  it('always returns a valid, non-empty challenge', () => {
    const challenge = pickDailyChallenge();
    expect(challenge.id).toBeTruthy();
    expect(challenge.title.items.length).toBeGreaterThan(0);
    expect(challenge.estimatedMinutes).toBeGreaterThan(0);
  });
});

describe('DAILY_CHALLENGES pool integrity', () => {
  const DIFFICULTIES: ChallengeDifficulty[] = ['easy', 'medium', 'hard'];
  const CATEGORIES: ChallengeCategory[] = [
    'types', 'variables', 'conditions', 'loops', 'functions', 'classes',
    'lists', 'inheritance', 'interfaces', 'enums', 'errors', 'debugging',
    'strings', 'linq',
  ];

  it('has a reasonably large pool', () => {
    expect(DAILY_CHALLENGES.length).toBeGreaterThanOrEqual(20);
  });

  it('has unique ids', () => {
    const ids = DAILY_CHALLENGES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has valid metadata and trilingual texts on every entry', () => {
    for (const c of DAILY_CHALLENGES) {
      expect(DIFFICULTIES).toContain(c.difficulty);
      expect(CATEGORIES).toContain(c.category);
      expect(c.estimatedMinutes).toBeGreaterThan(0);
      // DE (1), EN (2), RU (0) müssen vorhanden sein
      const langs = c.title.items.map((i) => i.language).sort();
      expect(langs).toEqual([0, 1, 2]);
      expect(c.description.items.length).toBe(3);
    }
  });

  it('covers every difficulty level', () => {
    const present = new Set(DAILY_CHALLENGES.map((c) => c.difficulty));
    expect(present).toEqual(new Set(DIFFICULTIES));
  });
});
