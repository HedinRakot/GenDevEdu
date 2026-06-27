import { useCallback, useEffect, useState } from 'react';
import {
  isDailyChallengeDone,
  markDailyChallengeDone,
  recordLearningActivity,
} from '@/store/storage';
import { toDateKey } from '@/utils/streakUtils';
import { pickDailyChallenge, type DailyChallenge } from '@/data/dailyChallenges';

interface UseDailyChallengeResult {
  challenge: DailyChallenge;
  dateKey: string;
  isDone: boolean;
  isLoading: boolean;
  /** Markiert die heutige Challenge als erledigt und erhöht den Streak. */
  complete: () => Promise<void>;
}

export function useDailyChallenge(): UseDailyChallengeResult {
  const dateKey = toDateKey(new Date());
  const challenge = pickDailyChallenge();

  const [isDone, setDone] = useState(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    isDailyChallengeDone(dateKey)
      .then(setDone)
      .finally(() => setLoading(false));
  }, [dateKey]);

  const complete = useCallback(async () => {
    if (isDone) return;
    await markDailyChallengeDone(dateKey);
    await recordLearningActivity();
    setDone(true);
  }, [dateKey, isDone]);

  return { challenge, dateKey, isDone, isLoading, complete };
}
