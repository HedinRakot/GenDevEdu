import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';

jest.mock('@/services/attendanceTracker', () => ({
  attendanceTracker: {
    track: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@/navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn(() => true),
    getCurrentRoute: jest.fn(() => ({
      name: 'Lesson',
      params: { courseId: 'c1', chapterId: 'ch1' },
    })),
  },
}));

import { attendanceTracker } from '@/services/attendanceTracker';
import {
  HEARTBEAT_INTERVAL_MS,
  useAttendanceTracking,
} from '@/hooks/useAttendanceTracking';

const mockedTrack = attendanceTracker.track as jest.Mock;
const mockedFlush = attendanceTracker.flush as jest.Mock;

let appStateListeners: Array<(state: string) => void>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  appStateListeners = [];
  (AppState as unknown as { currentState: string }).currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((
    _type: string,
    handler: (state: string) => void,
  ) => {
    appStateListeners.push(handler);
    return { remove: jest.fn() };
  }) as unknown as typeof AppState.addEventListener);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useAttendanceTracking', () => {
  it('sendet sofort und dann alle 60 s einen Heartbeat mit Route-Kontext', () => {
    renderHook(() => useAttendanceTracking(true));

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith('heartbeat', {
      screen: 'Lesson',
      courseId: 'c1',
      chapterId: 'ch1',
    });

    act(() => {
      jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    });
    expect(mockedTrack).toHaveBeenCalledTimes(3);
  });

  it('pausiert Heartbeats, wenn die App nicht aktiv ist, und flusht beim Wechsel', () => {
    renderHook(() => useAttendanceTracking(true));
    expect(mockedTrack).toHaveBeenCalledTimes(1);

    act(() => {
      (AppState as unknown as { currentState: string }).currentState = 'background';
      appStateListeners.forEach((listener) => listener('background'));
    });
    expect(mockedFlush).toHaveBeenCalled(); // Puffer beim Backgrounding sichern

    act(() => {
      jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);
    });
    expect(mockedTrack).toHaveBeenCalledTimes(1); // keine weiteren Heartbeats
  });

  it('trackt nichts, wenn deaktiviert (nicht angemeldet)', () => {
    renderHook(() => useAttendanceTracking(false));

    act(() => {
      jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2);
    });
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it('stoppt Timer und Listener beim Unmount', () => {
    const { unmount } = renderHook(() => useAttendanceTracking(true));
    expect(mockedTrack).toHaveBeenCalledTimes(1);

    unmount();
    act(() => {
      jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3);
    });
    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });
});
