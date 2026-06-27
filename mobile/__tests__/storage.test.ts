import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  STORAGE_KEYS,
  appendChatMessage,
  clearChatHistory,
  deleteNote,
  deleteSnippet,
  getChatHistory,
  getCompletedLessons,
  getDailyChallengeDoneDates,
  getDisplayStreak,
  getJson,
  getNotes,
  getSavedLanguage,
  getSnippets,
  getStreakState,
  isDailyChallengeDone,
  isSnippetSaved,
  markDailyChallengeDone,
  markLessonComplete,
  markLessonIncomplete,
  recordLearningActivity,
  saveLanguage,
  saveNote,
  setJson,
  updateChatMessage,
  updateNote,
  addSnippet,
} from '@/store/storage';
import type { ChatMessage } from '@/types/chat';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

const at = (iso: string) => new Date(`${iso}T12:00:00`);

describe('JSON helpers', () => {
  it('returns null for missing keys', async () => {
    expect(await getJson('does-not-exist')).toBeNull();
  });

  it('round-trips JSON values', async () => {
    await setJson('key', { a: 1, b: ['x'] });
    expect(await getJson<{ a: number; b: string[] }>('key')).toEqual({
      a: 1,
      b: ['x'],
    });
  });

  it('returns null when stored value is corrupt JSON', async () => {
    await AsyncStorage.setItem('bad', '{not-json');
    expect(await getJson('bad')).toBeNull();
  });

  it('returns null and logs when AsyncStorage.getItem rejects', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await getJson('whatever')).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('logs when AsyncStorage.setItem rejects', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await setJson('k', { x: 1 });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('Streak storage', () => {
  it('returns the empty state when nothing is stored', async () => {
    expect(await getStreakState()).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    });
  });

  it('records a learning activity and persists it', async () => {
    const next = await recordLearningActivity(at('2026-05-08'));
    expect(next.currentStreak).toBe(1);
    expect(next.lastActiveDate).toBe('2026-05-08');

    const persisted = await getStreakState();
    expect(persisted).toEqual(next);
  });

  it('does not write when the same day is recorded twice', async () => {
    await recordLearningActivity(at('2026-05-08'));
    const callsBefore = (AsyncStorage.setItem as jest.Mock).mock.calls.length;
    await recordLearningActivity(at('2026-05-08'));
    expect((AsyncStorage.setItem as jest.Mock).mock.calls.length).toBe(callsBefore);
  });

  it('extends a consecutive-day streak', async () => {
    await recordLearningActivity(at('2026-05-07'));
    const next = await recordLearningActivity(at('2026-05-08'));
    expect(next.currentStreak).toBe(2);
    expect(next.longestStreak).toBe(2);
  });

  it('getDisplayStreak normalizes an expired streak to 0', async () => {
    await recordLearningActivity(at('2026-05-01'));
    const display = await getDisplayStreak(at('2026-05-08'));
    expect(display.currentStreak).toBe(0);
    expect(display.longestStreak).toBe(1);
    expect(display.lastActiveDate).toBe('2026-05-01');
  });

  it('getDisplayStreak keeps a still-valid streak', async () => {
    await recordLearningActivity(at('2026-05-07'));
    const display = await getDisplayStreak(at('2026-05-08'));
    expect(display.currentStreak).toBe(1);
  });

  it('recordLearningActivity uses current date when now is omitted', async () => {
    const result = await recordLearningActivity();
    expect(result.currentStreak).toBe(1);
    expect(result.lastActiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getDisplayStreak uses current date when now is omitted', async () => {
    const result = await getDisplayStreak();
    expect(result).toHaveProperty('currentStreak');
    expect(result).toHaveProperty('longestStreak');
  });
});

describe('Lesson completion', () => {
  it('starts with an empty list', async () => {
    expect(await getCompletedLessons()).toEqual([]);
  });

  it('marks a lesson complete only once', async () => {
    await markLessonComplete('lesson-1');
    await markLessonComplete('lesson-1');
    expect(await getCompletedLessons()).toEqual(['lesson-1']);
  });

  it('marks multiple lessons complete', async () => {
    await markLessonComplete('a');
    await markLessonComplete('b');
    expect(await getCompletedLessons()).toEqual(['a', 'b']);
  });

  it('removes a lesson via markLessonIncomplete', async () => {
    await markLessonComplete('a');
    await markLessonComplete('b');
    await markLessonIncomplete('a');
    expect(await getCompletedLessons()).toEqual(['b']);
  });
});

describe('Daily challenge', () => {
  it('reports false for unmarked dates', async () => {
    expect(await isDailyChallengeDone('2026-05-08')).toBe(false);
  });

  it('marks a date as done idempotently', async () => {
    await markDailyChallengeDone('2026-05-08');
    await markDailyChallengeDone('2026-05-08');
    expect(await getDailyChallengeDoneDates()).toEqual(['2026-05-08']);
  });

  it('keeps only the last 60 entries', async () => {
    for (let i = 0; i < 65; i++) {
      await markDailyChallengeDone(`2026-01-${String(i + 1).padStart(2, '0')}`);
    }
    const dates = await getDailyChallengeDoneDates();
    expect(dates).toHaveLength(60);
    // Älteste 5 sollten verschwunden sein
    expect(dates[0]).toBe('2026-01-06');
  });
});

describe('Notes', () => {
  it('saves a note with generated id and timestamps', async () => {
    const note = await saveNote({ title: 'T', content: 'C' });
    expect(note.id).toMatch(/^note_/);
    expect(note.createdAt).toBeGreaterThan(0);
    expect(note.updatedAt).toBe(note.createdAt);
  });

  it('reads notes back, newest first', async () => {
    const a = await saveNote({ title: 'A', content: '1' });
    const b = await saveNote({ title: 'B', content: '2' });
    const list = await getNotes();
    expect(list.map((n) => n.id)).toEqual([b.id, a.id]);
  });

  it('updates a note title and bumps updatedAt', async () => {
    const created = await saveNote({ title: 'T', content: 'C' });
    await new Promise((r) => setTimeout(r, 5));
    await updateNote(created.id, { title: 'New' });
    const [stored] = await getNotes();
    expect(stored.title).toBe('New');
    expect(stored.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
  });

  it('updateNote leaves other notes untouched', async () => {
    const a = await saveNote({ title: 'A', content: '1' });
    await new Promise((r) => setTimeout(r, 5));
    const b = await saveNote({ title: 'B', content: '2' });
    await updateNote(b.id, { content: 'updated' });
    const list = await getNotes();
    expect(list.find((n) => n.id === a.id)?.content).toBe('1');
    expect(list.find((n) => n.id === b.id)?.content).toBe('updated');
  });

  it('deletes a note', async () => {
    const a = await saveNote({ title: 'A', content: '1' });
    await new Promise((r) => setTimeout(r, 5));
    await saveNote({ title: 'B', content: '2' });
    await deleteNote(a.id);
    const list = await getNotes();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('B');
  });
});

describe('Snippets', () => {
  it('starts empty', async () => {
    expect(await getSnippets()).toEqual([]);
  });

  it('creates a snippet with id + savedAt', async () => {
    const created = await addSnippet({
      title: 't',
      content: '```js\nconsole.log(1);\n```',
      source: 'chat',
      refId: 'msg_1',
      tags: ['js'],
    });
    expect(created.id).toMatch(/^snip_/);
    expect(created.savedAt).toBeGreaterThan(0);
  });

  it('lists snippets newest first', async () => {
    const a = await addSnippet({ title: 'a', content: 'a', source: 'manual' });
    const b = await addSnippet({ title: 'b', content: 'b', source: 'manual' });
    const list = await getSnippets();
    expect(list.map((s) => s.id)).toEqual([b.id, a.id]);
  });

  it('isSnippetSaved finds a stored snippet by predicate', async () => {
    await addSnippet({ title: 't', content: 'c', source: 'chat', refId: 'msg-42' });
    expect(await isSnippetSaved((s) => s.refId === 'msg-42')).toBe(true);
    expect(await isSnippetSaved((s) => s.refId === 'msg-99')).toBe(false);
  });

  it('deletes a snippet by id', async () => {
    const a = await addSnippet({ title: 'a', content: 'a', source: 'manual' });
    const b = await addSnippet({ title: 'b', content: 'b', source: 'manual' });
    await deleteSnippet(a.id);
    const list = await getSnippets();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(b.id);
  });
});

describe('Chat history', () => {
  const msg = (id: string, role: ChatMessage['role'] = 'user', content = 'hi'): ChatMessage => ({
    id,
    role,
    content,
    timestamp: Date.now(),
  });

  it('returns empty history initially', async () => {
    expect(await getChatHistory()).toEqual([]);
  });

  it('appends messages and preserves order', async () => {
    await appendChatMessage(msg('1'));
    await appendChatMessage(msg('2', 'model', 'hello'));
    const history = await getChatHistory();
    expect(history.map((m) => m.id)).toEqual(['1', '2']);
  });

  it('caps history at 100 entries', async () => {
    for (let i = 0; i < 110; i++) {
      await appendChatMessage(msg(`m_${i}`));
    }
    const history = await getChatHistory();
    expect(history).toHaveLength(100);
    // älteste 10 Messages wurden gekappt
    expect(history[0].id).toBe('m_10');
  });

  it('updateChatMessage replaces content and clears streaming', async () => {
    await appendChatMessage({ ...msg('m1', 'model', ''), isStreaming: true });
    await updateChatMessage('m1', 'final answer');
    const [stored] = await getChatHistory();
    expect(stored.content).toBe('final answer');
    expect(stored.isStreaming).toBe(false);
  });

  it('updateChatMessage is a no-op for unknown ids', async () => {
    await appendChatMessage(msg('m1', 'model', 'a'));
    await updateChatMessage('does-not-exist', 'b');
    const [stored] = await getChatHistory();
    expect(stored.content).toBe('a');
  });

  it('clearChatHistory wipes all messages', async () => {
    await appendChatMessage(msg('m1'));
    await clearChatHistory();
    expect(await getChatHistory()).toEqual([]);
  });
});

describe('Language settings', () => {
  it('returns null when no language is saved', async () => {
    expect(await getSavedLanguage()).toBeNull();
  });

  it('persists and reads back the language', async () => {
    await saveLanguage('en');
    expect(await getSavedLanguage()).toBe('en');
  });
});

describe('STORAGE_KEYS', () => {
  it('exposes stable, unique keys', () => {
    const values = Object.values(STORAGE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});
