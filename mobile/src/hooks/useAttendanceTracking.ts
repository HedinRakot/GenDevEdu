/**
 * F14: Heartbeat-Hook — sendet bei aktiver Nutzung alle 60 s ein Event mit
 * aktuellem Route-Kontext (Screen/Kurs/Kapitel). Einmal im signed-in-Zweig
 * des RootNavigator mounten.
 *
 * Aktiv = AppState 'active' UND (auf Web) Fenster fokussiert: react-native-web
 * mappt AppState auf die Page-Visibility-API, die bei Fensterblur mit
 * sichtbarem Tab NICHT feuert — daher der zusätzliche document.hasFocus()-Check.
 */
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { navigationRef } from '@/navigation/navigationRef';
import { attendanceTracker } from '@/services/attendanceTracker';

export const HEARTBEAT_INTERVAL_MS = 60_000;
export const FLUSH_INTERVAL_MS = 5 * 60_000;

function isActivelyUsed(): boolean {
  if (AppState.currentState !== 'active') return false;
  if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.hasFocus()) {
    return false;
  }
  return true;
}

function sendHeartbeat(): void {
  if (!isActivelyUsed()) return;
  const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
  const params = (route?.params ?? {}) as { courseId?: string; chapterId?: string };
  void attendanceTracker.track('heartbeat', {
    screen: route?.name,
    courseId: params.courseId,
    chapterId: params.chapterId,
  });
}

export function useAttendanceTracking(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    sendHeartbeat(); // sofortiger erster Heartbeat nach Login/App-Start
    const beatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const flushTimer = setInterval(() => void attendanceTracker.flush(), FLUSH_INTERVAL_MS);

    // Beim Wechsel in den Hintergrund den Puffer sichern (Best Effort).
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void attendanceTracker.flush();
    });

    return () => {
      clearInterval(beatTimer);
      clearInterval(flushTimer);
      subscription.remove();
    };
  }, [enabled]);
}
