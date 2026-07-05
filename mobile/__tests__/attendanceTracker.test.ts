import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn() },
}));

import { apiClient } from '@/services/apiClient';
import {
  ATTENDANCE_BUFFER_KEY,
  attendanceTracker,
} from '@/services/attendanceTracker';

const mockedPost = apiClient.post as jest.Mock;

async function bufferedEvents(): Promise<unknown[]> {
  const raw = await AsyncStorage.getItem(ATTENDANCE_BUFFER_KEY);
  return raw ? JSON.parse(raw) : [];
}

function axios400(): Error {
  const error = new Error('Bad Request') as Error & {
    isAxiosError: boolean;
    response: { status: number };
  };
  error.isAxiosError = true;
  error.response = { status: 400 };
  return error;
}

beforeEach(async () => {
  jest.clearAllMocks();
  attendanceTracker.__resetForTests();
  await AsyncStorage.clear();
  mockedPost.mockResolvedValue({ data: { accepted: 1, duplicates: 0, rejected: 0 } });
});

describe('attendanceTracker', () => {
  it('puffert Events mit Kontext und persistiert sie in AsyncStorage', async () => {
    await attendanceTracker.track('heartbeat', {
      screen: 'Lesson',
      courseId: 'c1',
      chapterId: 'ch1',
    });

    expect(attendanceTracker.pendingCount).toBe(1);
    const stored = (await bufferedEvents()) as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      type: 'heartbeat',
      screen: 'Lesson',
      courseId: 'c1',
      chapterId: 'ch1',
    });
    expect(stored[0].clientEventId).toBeTruthy();
    expect(stored[0].occurredAt).toBeTruthy();
  });

  it('flush sendet den Puffer und leert ihn bei Erfolg', async () => {
    await attendanceTracker.track('login');
    await attendanceTracker.track('heartbeat');

    const ok = await attendanceTracker.flush();

    expect(ok).toBe(true);
    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [url, body] = mockedPost.mock.calls[0];
    expect(url).toBe('/api/attendance/events');
    expect(body.events).toHaveLength(2);
    expect(attendanceTracker.pendingCount).toBe(0);
    expect(await bufferedEvents()).toHaveLength(0);
  });

  it('behält den Puffer bei Netzwerkfehlern', async () => {
    mockedPost.mockRejectedValue(new Error('Network Error'));
    await attendanceTracker.track('heartbeat');

    const ok = await attendanceTracker.flush();

    expect(ok).toBe(false);
    expect(attendanceTracker.pendingCount).toBe(1);
    expect(await bufferedEvents()).toHaveLength(1);
  });

  it('verwirft einen vom Server abgelehnten Batch (400) statt ewig zu blockieren', async () => {
    mockedPost.mockRejectedValue(axios400());
    await attendanceTracker.track('heartbeat');

    const ok = await attendanceTracker.flush();

    expect(ok).toBe(true);
    expect(attendanceTracker.pendingCount).toBe(0);
  });

  it('flusht automatisch ab 10 gepufferten Events', async () => {
    for (let i = 0; i < 10; i++) {
      await attendanceTracker.track('heartbeat');
    }
    await Promise.resolve(); // auto-flush ist fire-and-forget
    await Promise.resolve();

    expect(mockedPost).toHaveBeenCalled();
  });

  it('verhindert parallele Flushes (In-Flight-Guard)', async () => {
    let resolvePost: (v: unknown) => void = () => {};
    mockedPost.mockImplementation(
      () => new Promise((resolve) => (resolvePost = resolve)),
    );
    await attendanceTracker.track('heartbeat');

    const first = attendanceTracker.flush();
    const second = await attendanceTracker.flush(); // läuft schon → false, kein 2. POST

    expect(second).toBe(false);
    resolvePost({ data: { accepted: 1, duplicates: 0, rejected: 0 } });
    await first;
    expect(mockedPost).toHaveBeenCalledTimes(1);
  });

  it('lädt beim ersten Zugriff ungesendete Events aus AsyncStorage (App-Neustart)', async () => {
    await AsyncStorage.setItem(
      ATTENDANCE_BUFFER_KEY,
      JSON.stringify([
        { clientEventId: 'alt-1', type: 'logout', occurredAt: '2026-07-04T18:00:00.000Z' },
      ]),
    );
    attendanceTracker.__resetForTests(); // simuliert frischen App-Start

    await attendanceTracker.track('login');

    expect(attendanceTracker.pendingCount).toBe(2);
    await attendanceTracker.flush();
    const [, body] = mockedPost.mock.calls[0];
    expect(body.events.map((e: { clientEventId: string }) => e.clientEventId)).toContain('alt-1');
  });
});
