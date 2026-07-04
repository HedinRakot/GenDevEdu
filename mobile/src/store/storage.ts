import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/types/chat';
import type { Snippet } from '@/types/snippet';
import {
  computeNextStreak,
  isStreakStillValid,
  type StreakState,
} from '@/utils/streakUtils';

// ─── Schlüssel-Konstanten ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  // Streak
  STREAK_STATE: 'streak.state',

  // Lernfortschritt
  COMPLETED_LESSONS: 'progress.completedLessons',
  COMPLETED_QUIZZES: 'progress.completedQuizzes',

  // Daily Coding Challenge
  DAILY_CHALLENGE_DONE: 'challenge.completedDates',

  // Notizen
  NOTES: 'notes.list',

  // Snippets / Cheatsheet
  SNIPPETS: 'snippets.list',

  // Chat
  CHAT_HISTORY: 'chat.history',

  // Einstellungen
  LANGUAGE: 'settings.language',
  THEME: 'settings.theme',

  // Notifications
  NOTIFICATION_ID: 'notifications.streakReminderId',
  NOTIFICATIONS_ENABLED: 'notifications.enabled',
} as const;

// ─── Generische Helper ────────────────────────────────────────────────────────

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Error reading JSON from storage:', e);
    return null;
  }
}

export async function setJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing JSON to storage:', e);
  }
}

// ─── Streak-Helpers ───────────────────────────────────────────────────────────

const EMPTY_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

export async function getStreakState(): Promise<StreakState> {
  return (await getJson<StreakState>(STORAGE_KEYS.STREAK_STATE)) ?? EMPTY_STREAK;
}

/** Wird aufgerufen, sobald der User heute eine Lerneinheit abgeschlossen hat. */
export async function recordLearningActivity(now: Date = new Date()): Promise<StreakState> {
  const previous = await getStreakState();
  const next = computeNextStreak(previous, now);
  if (next !== previous) {
    await setJson(STORAGE_KEYS.STREAK_STATE, next);
  }
  return next;
}

/** Aktueller Anzeigestatus (verfallene Streaks werden auf 0 normalisiert). */
export async function getDisplayStreak(
  now: Date = new Date(),
): Promise<{ currentStreak: number; longestStreak: number; lastActiveDate: string | null }> {
  const state = await getStreakState();
  const valid = isStreakStillValid(state, now);
  return {
    currentStreak: valid ? state.currentStreak : 0,
    longestStreak: state.longestStreak,
    lastActiveDate: state.lastActiveDate,
  };
}

// ─── Fortschritts-Helpers ─────────────────────────────────────────────────────

export async function getCompletedLessons(): Promise<string[]> {
  return (await getJson<string[]>(STORAGE_KEYS.COMPLETED_LESSONS)) ?? [];
}

export async function markLessonComplete(lessonId: string): Promise<void> {
  const completed = await getCompletedLessons();
  if (!completed.includes(lessonId)) {
    await setJson(STORAGE_KEYS.COMPLETED_LESSONS, [...completed, lessonId]);
  }
}

export async function markLessonIncomplete(lessonId: string): Promise<void> {
  const completed = await getCompletedLessons();
  await setJson(
    STORAGE_KEYS.COMPLETED_LESSONS,
    completed.filter((id) => id !== lessonId),
  );
}

// ─── Daily-Challenge-Helpers ──────────────────────────────────────────────────

export async function getDailyChallengeDoneDates(): Promise<string[]> {
  return (await getJson<string[]>(STORAGE_KEYS.DAILY_CHALLENGE_DONE)) ?? [];
}

export async function isDailyChallengeDone(dateKey: string): Promise<boolean> {
  const dates = await getDailyChallengeDoneDates();
  return dates.includes(dateKey);
}

export async function markDailyChallengeDone(dateKey: string): Promise<void> {
  const dates = await getDailyChallengeDoneDates();
  if (!dates.includes(dateKey)) {
    // Nur die letzten 60 Tage behalten
    const next = [...dates, dateKey].slice(-60);
    await setJson(STORAGE_KEYS.DAILY_CHALLENGE_DONE, next);
  }
}

// ─── Notizen-Helpers ──────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export async function getNotes(): Promise<Note[]> {
  return (await getJson<Note[]>(STORAGE_KEYS.NOTES)) ?? [];
}

export async function saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const notes = await getNotes();
  const newNote: Note = {
    ...note,
    id: `note_${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setJson(STORAGE_KEYS.NOTES, [newNote, ...notes]);
  return newNote;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, 'title' | 'content'>>,
): Promise<void> {
  const notes = await getNotes();
  const updated = notes.map((n) =>
    n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
  );
  await setJson(STORAGE_KEYS.NOTES, updated);
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  await setJson(
    STORAGE_KEYS.NOTES,
    notes.filter((n) => n.id !== id),
  );
}

// ─── Snippet-Helpers (Cheatsheet / Favoriten) ─────────────────────────────────

export async function getSnippets(): Promise<Snippet[]> {
  return (await getJson<Snippet[]>(STORAGE_KEYS.SNIPPETS)) ?? [];
}

export async function addSnippet(snippet: Omit<Snippet, 'id' | 'savedAt'>): Promise<Snippet> {
  const list = await getSnippets();
  const created: Snippet = {
    ...snippet,
    id: `snip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
  };
  await setJson(STORAGE_KEYS.SNIPPETS, [created, ...list]);
  return created;
}

export async function deleteSnippet(id: string): Promise<void> {
  const list = await getSnippets();
  await setJson(
    STORAGE_KEYS.SNIPPETS,
    list.filter((s) => s.id !== id),
  );
}

export async function isSnippetSaved(predicate: (s: Snippet) => boolean): Promise<boolean> {
  const list = await getSnippets();
  return list.some(predicate);
}

// ─── Chat-Historie-Helpers ────────────────────────────────────────────────────

export async function getChatHistory(): Promise<ChatMessage[]> {
  return (await getJson<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY)) ?? [];
}

export async function appendChatMessage(message: ChatMessage): Promise<void> {
  const history = await getChatHistory();
  const trimmed = [...history, message].slice(-100);
  await setJson(STORAGE_KEYS.CHAT_HISTORY, trimmed);
}

export async function updateChatMessage(
  id: string,
  content: string,
  sources?: ChatMessage['sources'],
): Promise<void> {
  const history = await getChatHistory();
  const updated = history.map((m) =>
    m.id === id
      ? { ...m, content, isStreaming: false, ...(sources && sources.length ? { sources } : {}) }
      : m,
  );
  await setJson(STORAGE_KEYS.CHAT_HISTORY, updated);
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
}

// ─── Einstellungs-Helpers ─────────────────────────────────────────────────────

export async function getSavedLanguage(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
}

export async function saveLanguage(lang: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
}
