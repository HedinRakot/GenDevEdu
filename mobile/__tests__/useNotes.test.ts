import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useNotes } from '@/hooks/useNotes';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('useNotes', () => {
  it('loads empty notes on mount', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notes).toEqual([]);
  });

  it('addNote() prepends a new note and persists it', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addNote('Titel', 'Inhalt');
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].title).toBe('Titel');
    expect(result.current.notes[0].content).toBe('Inhalt');
  });

  it('editNote() updates an existing note in place', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addNote('Original', 'Text');
    });
    const id = result.current.notes[0].id;

    await act(async () => {
      await result.current.editNote(id, { title: 'Aktualisiert' });
    });

    expect(result.current.notes[0].title).toBe('Aktualisiert');
    expect(result.current.notes[0].content).toBe('Text');
  });

  it('removeNote() deletes the note from the list', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addNote('Zum Löschen', 'Inhalt');
    });
    const id = result.current.notes[0].id;

    await act(async () => {
      await result.current.removeNote(id);
    });

    expect(result.current.notes).toHaveLength(0);
  });
});
