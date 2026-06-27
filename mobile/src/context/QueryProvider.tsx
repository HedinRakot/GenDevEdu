import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Query Client Konfiguration ───────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * staleTime: Daten gelten für 1 Stunde als frisch.
       * In dieser Zeit werden keine neuen Netzwerk-Requests gemacht.
       * Ideal für Kursinhalte, die sich selten ändern.
       */
      staleTime: 1000 * 60 * 60, // 1 Stunde

      /**
       * gcTime (früher cacheTime): Daten bleiben 24 Stunden im Cache,
       * auch wenn kein Component sie abonniert hat.
       * Ermöglicht vollständigen Offline-Betrieb für einen Tag.
       */
      gcTime: 1000 * 60 * 60 * 24, // 24 Stunden

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

// ─── Provider ─────────────────────────────────────────────────────────────────
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Exportiere den Query Client für direkten Zugriff (z.B. Mutations, Invalidierung). */
export { queryClient };
