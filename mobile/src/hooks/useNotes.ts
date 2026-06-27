import { useState, useEffect, useCallback } from 'react';
import { getNotes, saveNote, updateNote, deleteNote, type Note } from '@/store/storage';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const data = await getNotes();
    setNotes(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addNote = async (title: string, content: string) => {
    const newNote = await saveNote({ title, content });
    setNotes((prev) => [newNote, ...prev]);
  };

  const editNote = async (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    await updateNote(id, updates);
    await loadNotes();
  };

  const removeNote = async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notes,
    isLoading,
    addNote,
    editNote,
    removeNote,
    refreshNotes: loadNotes,
  };
}
