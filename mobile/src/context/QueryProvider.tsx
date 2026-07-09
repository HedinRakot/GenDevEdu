import React from 'react';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

// ─── Query Client Konfiguration ───────────────────────────────────────────────
const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * staleTime: Daten gelten für 1 Stunde als frisch.
       * In dieser Zeit werden keine neuen Netzwerk-Requests gemacht.
       * Ideal für Kursinhalte, die sich selten ändern.
       */
      staleTime: ONE_HOUR,

      /**
       * gcTime (früher cacheTime): Daten bleiben 24 Stunden im Cache,
       * auch wenn kein Component sie abonniert hat. Muss >= maxAge des
       * Persisters sein, sonst würde ein Eintrag vor dem Rehydrieren verworfen.
       */
      gcTime: ONE_DAY,

      /**
       * retry: Bei Netzwerkfehler maximal 2 Wiederholungsversuche.
       * Exponentielles Backoff ist Standard in React Query.
       */
      retry: 2,

      /**
       * refetchOnWindowFocus: Kein automatisches Refetch beim App-Fokus.
       * Reduziert unnötige API-Calls auf mobilen Geräten.
       */
      refetchOnWindowFocus: false,

      /**
       * networkMode: 'offlineFirst' nutzt den Cache bevorzugt,
       * wenn keine Netzwerkverbindung verfügbar ist.
       */
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Ein NetInfo-Status gilt als "online", solange weder Verbindung noch
 * Internet-Erreichbarkeit explizit auf false stehen (isInternetReachable ist
 * anfangs null = "noch unbekannt" → nicht als offline werten).
 */
export function netInfoStateIsOnline(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * onlineManager mit NetInfo verdrahten: React Query weiß dadurch, ob echtes
 * Internet verfügbar ist, pausiert Requests offline und fetcht bei Rückkehr
 * automatisch neu. Ohne diese Verdrahtung nimmt React Query in React Native
 * dauerhaft "online" an.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(netInfoStateIsOnline(state))),
);

/**
 * Persister: dehydriert den Query-Cache nach AsyncStorage, sodass Kursinhalte
 * und Fortschritt einen App-Neustart überleben (echter Offline-Betrieb für
 * einen Tag). Vor der Einführung war der Cache rein in-memory.
 */
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'devedu-query-cache',
  throttleTime: 1000,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: ONE_DAY,
        // Cache-Version: bei Query-Struktur-Änderungen hochzählen, um alte
        // dehydrierte Daten zu verwerfen.
        buster: 'v1',
        dehydrateOptions: {
          // Nur erfolgreiche Queries persistieren (keine Fehler/laufenden).
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/** Exportiere den Query Client für direkten Zugriff (z.B. Mutations, Invalidierung). */
export { queryClient };
