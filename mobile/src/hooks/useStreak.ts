import { useCallback, useEffect, useState } from 'react';
import { getDisplayStreak, recordLearningActivity } from '@/store/storage';

interface StreakHook {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  isLoading: boolean;
  /** Markiert eine abgeschlossene Lern-/Challenge-Aktivität für heute. */
  recordActivity: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStreak(): StreakHook {
  const [state, setState] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getDisplayStreak();
    setState(data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const recordActivity = useCallback(async () => {
    const next = await recordLearningActivity();
    setState({
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastActiveDate: next.lastActiveDate,
    });
  }, []);

  return { ...state, isLoading, recordActivity, refresh };
}
