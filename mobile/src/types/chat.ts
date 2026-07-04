// ─── Chat & KI-Typen ─────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'model';

/** RAG-Quelle einer Assistenz-Antwort (Kapitel/Lektion/Frage aus dem Kurs). */
export interface ChatSource {
  title: string;
  kind: string;
  chapterId: string;
  courseId: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Unix-Timestamp (ms) */
  timestamp: number;
  isStreaming?: boolean;
  /** RAG-Quellen (nur bei Assistenz-Antworten mit Kursbezug). */
  sources?: ChatSource[];
}

/** Persistente Chat-Historie in AsyncStorage (Array von Messages, JSON-serialisiert). */
export type StoredChatHistory = ChatMessage[];

/** Gemini-kompatibles History-Format */
export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
