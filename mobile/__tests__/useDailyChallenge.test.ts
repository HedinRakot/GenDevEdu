import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Server-Challenge im Test nicht erreichbar -> Hook nutzt den lokalen Pool als Fallback.
jest.mock('@/api/challenges', () => ({
  fetchTodayChallenge: jest.fn().mockRejectedValue(new Error('offline')),
}));

import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { markDailyChallengeDone } from '@/store/storage';
import { toDateKey } from '@/utils/streakUtils';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

const renderChallengeHook = () => renderHook(() => useDailyChallenge(), { wrapper });

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('useDailyChallenge', () => {
  it('starts with isDone=false when storage is empty', async () => {
    const { result } = renderChallengeHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDone).toBe(false);
  });

  it('complete() sets isDone to true', async () => {
    const { result } = renderChallengeHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.isDone).toBe(true);
  });

  it('complete() is idempotent: calling twice only stores the date once', async () => {
    const { result } = renderChallengeHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.complete(); });
    await act(async () => { await result.current.complete(); });

    const raw = await AsyncStorage.getItem('challenge.completedDates');
    const dates = JSON.parse(raw ?? '[]') as string[];
    const todayKey = result.current.dateKey;
    expect(dates.filter((d) => d === todayKey).length).toBe(1);
  });

  it('starts with isDone=true when today is already in storage', async () => {
    const todayKey = toDateKey(new Date());
    await markDailyChallengeDone(todayKey);

    const { result } = renderChallengeHook();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDone).toBe(true);
  });
});

