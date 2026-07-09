import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  isDailyChallengeDone,
  markDailyChallengeDone,
  recordLearningActivity,
} from '@/store/storage';
import { toDateKey } from '@/utils/streakUtils';
import { pickDailyChallenge, type DailyChallenge } from '@/data/dailyChallenges';
import { fetchTodayChallenge } from '@/api/challenges';

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

  // Server-verwaltete Tages-Challenge; der lokale Pool bleibt als
  // Offline-/Fehler-Fallback erhalten (dann ggf. eine andere Challenge).
  const { data: serverChallenge } = useQuery({
    queryKey: ['daily-challenge', 'today', dateKey] as const,
    queryFn: fetchTodayChallenge,
    staleTime: 1000 * 60 * 60, // innerhalb des Tages stabil
    retry: 1,
  });

  const challenge: DailyChallenge = serverChallenge
    ? {
        id: serverChallenge.id,
        title: serverChallenge.title,
        description: serverChallenge.description,
        exampleSnippet: serverChallenge.exampleSnippet ?? undefined,
        snippetLang: serverChallenge.snippetLang,
        estimatedMinutes: serverChallenge.estimatedMinutes,
        difficulty: serverChallenge.difficulty as DailyChallenge['difficulty'],
        category: serverChallenge.category as DailyChallenge['category'],
      }
    : pickDailyChallenge();

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
