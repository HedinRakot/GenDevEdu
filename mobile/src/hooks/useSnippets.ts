import { useCallback, useEffect, useState } from 'react';
import {
  addSnippet,
  deleteSnippet,
  getSnippets,
} from '@/store/storage';
import type { Snippet } from '@/types/snippet';

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getSnippets();
    setSnippets(data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const save = useCallback(async (snippet: Omit<Snippet, 'id' | 'savedAt'>) => {
    const created = await addSnippet(snippet);
    setSnippets((prev) => [created, ...prev]);
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const isFavorited = useCallback(
    (refId: string | undefined) => !!refId && snippets.some((s) => s.refId === refId),
    [snippets],
  );

  return { snippets, isLoading, save, remove, refresh, isFavorited };
}
