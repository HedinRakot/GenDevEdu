/**
 * Backend-Chat-Client (SSE) gegen POST /api/chat.
 *
 * Der Provider-Key liegt serverseitig; hier wird nur das Clerk-Bearer-Token
 * mitgeschickt. Auf Web liefert fetch einen ReadableStream (echtes Streaming);
 * auf nativen Plattformen ohne Stream-Body wird die volle Antwort gelesen und
 * am Ende einmal geparst. Bei Netzwerk-/Serverfehler wird — falls ein
 * clientseitiger Gemini-Key vorhanden ist — auf den direkten Gemini-Pfad
 * zurückgefallen (Offline-/Degradationspfad).
 */
import { API_BASE_URL, GEMINI_API_KEY } from '@/config/env';
import { getApiToken } from '@/services/apiClient';
import { emitForceLogout } from '@/services/authEvents';
import { sendMessageStreaming as geminiStreaming } from '@/api/gemini';
import type { ChatMessage, ChatSource } from '@/types/chat';

export interface ChatContext {
  courseId?: string;
  chapterId?: string;
  contentId?: string;
  questionId?: string;
}

export interface ChatStreamOptions {
  provider?: 'gemini' | 'claude';
  context?: ChatContext;
  signal?: AbortSignal;
  /** RAG-Quellen der Antwort (kommen als letztes SSE-Event vor "done"). */
  onSources?: (sources: ChatSource[]) => void;
}

type OnChunk = (chunk: string, fullText: string) => void;

/** Wandelt die lokale Historie ins Backend-Format (role user|assistant). */
function toBackendMessages(history: ChatMessage[], userMessage: string) {
  const prior = history
    .filter((m) => !m.isStreaming && m.content.trim())
    .map((m) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content }));
  return [...prior, { role: 'user', content: userMessage }];
}

/** Extrahiert vollständige SSE-Events aus dem Puffer; gibt den Rest-Puffer zurück. */
function drainEvents(buffer: string, onEvent: (evt: Record<string, unknown>) => void): string {
  let idx: number;
  while ((idx = buffer.indexOf('\n\n')) !== -1) {
    const raw = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 2);
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const payload = s.slice(5).trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload));
      } catch {
        /* unvollständige/nicht-JSON-Zeile ignorieren */
      }
    }
  }
  return buffer;
}

/**
 * Sendet eine Nachricht an den Backend-Tutor und streamt die Antwort.
 * Signaturkompatibel zu gemini.sendMessageStreaming, damit die UI austauschbar bleibt.
 */
export async function sendChatStreaming(
  userMessage: string,
  history: ChatMessage[],
  onChunk: OnChunk,
  opts: ChatStreamOptions = {},
): Promise<string> {
  const token = await getApiToken();
  const body = JSON.stringify({
    messages: toBackendMessages(history, userMessage),
    provider: opts.provider,
    context: opts.context,
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      signal: opts.signal,
    });
  } catch (networkErr) {
    return fallbackOrThrow(userMessage, history, onChunk, networkErr);
  }

  if (res.status === 401) {
    emitForceLogout();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    return fallbackOrThrow(userMessage, history, onChunk, new Error(`HTTP_${res.status}`));
  }

  let fullText = '';
  let failed = false;
  const onEvent = (evt: Record<string, unknown>) => {
    if (typeof evt.delta === 'string') {
      fullText += evt.delta;
      onChunk(evt.delta, fullText);
    } else if (Array.isArray(evt.sources)) {
      opts.onSources?.(evt.sources as ChatSource[]);
    } else if (evt.error) {
      failed = true;
    }
  };

  const body$ = res.body as ReadableStream<Uint8Array> | null | undefined;
  if (body$ && typeof body$.getReader === 'function') {
    // Web: echtes Streaming.
    const reader = body$.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = drainEvents(buffer, onEvent);
      if (failed) break;
    }
  } else {
    // Nativer Fallback ohne Stream-Body: volle Antwort lesen, dann parsen.
    const text = await res.text();
    drainEvents(text.endsWith('\n\n') ? text : text + '\n\n', onEvent);
  }

  if (failed) throw new Error('CHAT_FAILED');
  return fullText;
}

/** Fällt auf den direkten Gemini-Pfad zurück, wenn ein Client-Key vorhanden ist. */
function fallbackOrThrow(
  userMessage: string,
  history: ChatMessage[],
  onChunk: OnChunk,
  cause: unknown,
): Promise<string> {
  if (GEMINI_API_KEY.length > 0) {
    return geminiStreaming(userMessage, history, onChunk);
  }
  throw cause instanceof Error ? cause : new Error('CHAT_FAILED');
}
