// ─── Chat & KI-Typen ─────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Unix-Timestamp (ms) */
  timestamp: number;
  isStreaming?: boolean;
}

/** Persistente Chat-Historie in AsyncStorage (Array von Messages, JSON-serialisiert). */
export type StoredChatHistory = ChatMessage[];

/** Gemini-kompatibles History-Format */
export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
