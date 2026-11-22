import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, MutationObserver, dehydrate, hydrate, onlineManager } from '@tanstack/react-query';
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

describe('offline mutations queue (pause → persist → restart → resume)', () => {
  const KEY = ['completeContent'];
  // networkMode 'online' pausiert eine Mutation offline sofort (ohne die fn zu starten) —
  // damit lässt sich der Persist/Resume-Mechanismus des QueryProviders isoliert prüfen.
  const clientOpts = {
    defaultOptions: { mutations: { networkMode: 'online' as const, retry: 0 } },
  };

  afterEach(() => onlineManager.setOnline(true));

  it('persists a paused mutation and re-sends it on the next client once online', async () => {
    // ── Session 1: offline → Mutation pausiert statt zu laufen ──
    onlineManager.setOnline(false);
    expect(onlineManager.isOnline()).toBe(false);
    const first = new QueryClient(clientOpts);
    const firstFn = jest.fn().mockResolvedValue(undefined);
    first.setMutationDefaults(KEY, { mutationFn: firstFn });

    const observer = new MutationObserver<unknown, Error, string>(first, { mutationKey: KEY });
    observer.mutate('content-1').catch(() => {});
    await new Promise((r) => setTimeout(r, 0));

    expect(firstFn).not.toHaveBeenCalled(); // offline → nicht ausgeführt

    // ── Dehydrieren wie im QueryProvider (nur pausierte Mutations) ──
    const dehydrated = dehydrate(first, {
      shouldDehydrateMutation: (m) => m.state.isPaused,
    });
    expect(dehydrated.mutations).toHaveLength(1);

    // ── Session 2: frischer Client rehydriert + geht online → nachsenden ──
    const second = new QueryClient(clientOpts);
    const secondFn = jest.fn().mockResolvedValue(undefined);
    second.setMutationDefaults(KEY, { mutationFn: secondFn });
    hydrate(second, dehydrated);

    onlineManager.setOnline(true);
    await second.resumePausedMutations();

    // react-query übergibt der mutationFn zusätzlich ein Kontext-Objekt → nur erstes Arg prüfen.
    expect(secondFn).toHaveBeenCalledTimes(1);
    expect(secondFn.mock.calls[0][0]).toBe('content-1');

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
