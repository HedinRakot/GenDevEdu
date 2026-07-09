import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  persistQueryClientSave,
  persistQueryClientRestore,
} from '@tanstack/react-query-persist-client';

// Import verdrahtet als Nebeneffekt onlineManager mit dem NetInfo-Mock.
import { netInfoStateIsOnline } from '@/context/QueryProvider';

describe('netInfoStateIsOnline', () => {
  it('is online when connected and internet reachable', () => {
    expect(netInfoStateIsOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('treats unknown reachability (null) as still online', () => {
    expect(netInfoStateIsOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
  });

  it('is offline when disconnected', () => {
    expect(netInfoStateIsOnline({ isConnected: false, isInternetReachable: false })).toBe(false);
  });

  it('is offline when internet explicitly unreachable', () => {
    expect(netInfoStateIsOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
});

describe('query cache persistence (AsyncStorage roundtrip)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('survives a fresh QueryClient (simulated app restart)', async () => {
    const persister = createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'devedu-query-cache',
      throttleTime: 0,
    });

    // gcTime: Infinity → keine Garbage-Collection-Timer (sonst offene Handles im Test).
    const opts = { defaultOptions: { queries: { gcTime: Infinity } } };

    // App-Session 1: Kursdaten liegen erfolgreich im Cache.
    const first = new QueryClient(opts);
    first.setQueryData(['courses'], [{ id: 'c1', name: '.NET Grundlagen' }]);
    await persistQueryClientSave({ queryClient: first, persister });

    // App-Session 2: frischer Client (in-memory leer) → aus AsyncStorage rehydrieren.
    const second = new QueryClient(opts);
    expect(second.getQueryData(['courses'])).toBeUndefined();
    await persistQueryClientRestore({ queryClient: second, persister, maxAge: 1000 * 60 * 60 * 24 });

    expect(second.getQueryData(['courses'])).toEqual([{ id: 'c1', name: '.NET Grundlagen' }]);

    first.clear();
    second.clear();
  });
});

describe('onlineManager ↔ NetInfo wiring', () => {
  it('reflects NetInfo connectivity events on the onlineManager', () => {
    // Ein Subscriber aktiviert das per setEventListener registrierte NetInfo-Setup.
    const unsubscribe = onlineManager.subscribe(() => {});
    try {
      (NetInfo as unknown as { __emit: (s: unknown) => void }).__emit({
        isConnected: false,
        isInternetReachable: false,
      });
      expect(onlineManager.isOnline()).toBe(false);

      (NetInfo as unknown as { __emit: (s: unknown) => void }).__emit({
        isConnected: true,
        isInternetReachable: true,
      });
      expect(onlineManager.isOnline()).toBe(true);
    } finally {
      unsubscribe();
      onlineManager.setOnline(true);
    }
  });
});
