import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSnippets } from '@/hooks/useSnippets';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('useSnippets', () => {
  it('loads empty snippets on mount', async () => {
    const { result } = renderHook(() => useSnippets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snippets).toEqual([]);
  });

  it('save() adds a new snippet to the list', async () => {
    const { result } = renderHook(() => useSnippets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.save({ title: 'Mein Snippet', content: '```js\nconsole.log(1)\n```', source: 'chat' });
    });

    expect(result.current.snippets).toHaveLength(1);
    expect(result.current.snippets[0].title).toBe('Mein Snippet');
  });

  it('isFavorited() returns true when a snippet with that refId exists', async () => {
    const { result } = renderHook(() => useSnippets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.save({ title: 'S', content: 'c', source: 'lesson', refId: 'lesson-42' });
    });

    expect(result.current.isFavorited('lesson-42')).toBe(true);
    expect(result.current.isFavorited('other-id')).toBe(false);
    expect(result.current.isFavorited(undefined)).toBe(false);
  });

  it('remove() deletes the snippet from the list', async () => {
    const { result } = renderHook(() => useSnippets());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.save({ title: 'Löschen', content: 'c', source: 'manual' });
    });
    const id = result.current.snippets[0].id;

    await act(async () => {
      await result.current.remove(id);
    });

    expect(result.current.snippets).toHaveLength(0);
  });
});
