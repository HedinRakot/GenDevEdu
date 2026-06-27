export type SnippetSource = 'chat' | 'lesson' | 'manual';

export interface Snippet {
  id: string;
  /** Titel/Hinweis für den User */
  title: string;
  /** Markdown-Inhalt (Code-Blöcke werden gerendert) */
  content: string;
  /** Herkunft des Snippets */
  source: SnippetSource;
  /** Optionaler Verweis (z.B. Lesson-ID, Chat-Message-ID) */
  refId?: string;
  /** Optionale Tags zum Filtern */
  tags?: string[];
  /** Unix-Timestamp (ms) */
  savedAt: number;
}
