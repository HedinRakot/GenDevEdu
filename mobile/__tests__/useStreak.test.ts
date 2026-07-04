import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/store/storage', () => ({
  getDisplayStreak: jest.fn(),
  recordLearningActivity: jest.fn(),
}));

import { useStreak } from '@/hooks/useStreak';
import { getDisplayStreak, recordLearningActivity } from '@/store/storage';

const mockedGet = getDisplayStreak as jest.Mock;
const mockedRecord = recordLearningActivity as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedGet.mockResolvedValue({ currentStreak: 3, longestStreak: 5, lastActiveDate: '2026-06-29' });
});

describe('useStreak', () => {
  it('hydrates from storage on mount', async () => {
    const { result } = renderHook(() => useStreak());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentStreak).toBe(3);
    expect(result.current.longestStreak).toBe(5);
    expect(result.current.lastActiveDate).toBe('2026-06-29');
  });

  it('updates state when an activity is recorded', async () => {
    mockedRecord.mockResolvedValue({ currentStreak: 4, longestStreak: 5, lastActiveDate: '2026-06-30' });
    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.recordActivity();
    });

    expect(mockedRecord).toHaveBeenCalled();
    expect(result.current.currentStreak).toBe(4);
    expect(result.current.lastActiveDate).toBe('2026-06-30');
  });
});
