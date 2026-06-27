/**
 * Reine, testbare Streak-Logik – ohne AsyncStorage.
 *
 * Eine Lerneinheit pro Tag erhöht den Streak. Wird ein Tag ausgelassen,
 * startet der Zähler bei der nächsten Aktivität wieder bei 1.
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

/** Format YYYY-MM-DD aus einem Date-Objekt (lokaler Tag). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Tag-Differenz zwischen zwei YYYY-MM-DD-Schlüsseln (b - a). */
export function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/**
 * Berechnet den neuen Streak-Status nach einer abgeschlossenen Lerneinheit.
 *
 * @param previous Bisheriger Zustand
 * @param now      Aktueller Zeitpunkt (für Testbarkeit injizierbar)
 */
export function computeNextStreak(previous: StreakState, now: Date = new Date()): StreakState {
  const today = toDateKey(now);

  // Bereits heute aktiv → keine Änderung
  if (previous.lastActiveDate === today) {
    return previous;
  }

  let nextStreak: number;
  if (!previous.lastActiveDate) {
    nextStreak = 1;
  } else {
    const diff = dayDiff(previous.lastActiveDate, today);
    nextStreak = diff === 1 ? previous.currentStreak + 1 : 1;
  }

  return {
    currentStreak: nextStreak,
    longestStreak: Math.max(nextStreak, previous.longestStreak),
    lastActiveDate: today,
  };
}

/**
 * Prüft, ob der Streak-Zähler "verfallen" ist – also zwischen letzter
 * Aktivität und heute mehr als ein Tag liegt. In diesem Fall sollte das
 * UI 0 statt der gespeicherten Zahl anzeigen.
 */
export function isStreakStillValid(state: StreakState, now: Date = new Date()): boolean {
  if (!state.lastActiveDate) return false;
  const diff = dayDiff(state.lastActiveDate, toDateKey(now));
  return diff <= 1;
}
