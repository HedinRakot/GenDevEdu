import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { markDailyChallengeDone } from '@/store/storage';
import { toDateKey } from '@/utils/streakUtils';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('useDailyChallenge', () => {
  it('starts with isDone=false when storage is empty', async () => {
    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDone).toBe(false);
  });

  it('complete() sets isDone to true', async () => {
    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.complete();
    });

    expect(result.current.isDone).toBe(true);
  });

  it('complete() is idempotent: calling twice only stores the date once', async () => {
    const { result } = renderHook(() => useDailyChallenge());
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

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isDone).toBe(true);
  });
});
