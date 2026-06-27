/**
 * Gemini AI Integration
 * Modell: gemini-2.0-flash
 * SDK: @google/generative-ai
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '@/config/env';
import type { ChatMessage, GeminiHistoryEntry } from '@/types/chat';

// ─── Client-Instanz ───────────────────────────────────────────────────────────
/**
 * Erstellt den Gemini-Client.
 * API-Key wird aus src/config/env.ts gelesen.
 */
function createGeminiClient() {
  if (!GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

// ─── System-Prompt ────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `Du bist EduBot, ein freundlicher und kompetenter KI-Tutor für Softwareentwicklung.

Deine Aufgaben:
- Erkläre Programmierkonzepte klar und verständlich (für Anfänger bis Fortgeschrittene)
- Gib immer konkrete Codebeispiele, wenn es sinnvoll ist
- Nutze Markdown für Formatierung (Überschriften, Listen, Code-Blöcke)
- Antworte auf Deutsch, es sei denn, der User schreibt in einer anderen Sprache
- Bleibe beim Thema Softwareentwicklung (JavaScript, TypeScript, React Native, Python, Datenbanken, Algorithmen, etc.)
- Sei ermutigend und positiv

Wenn du nach persönlichen Informationen gefragt wirst oder nach Themen außerhalb der Softwareentwicklung, erkläre freundlich deinen Fokusbereich.`;

// ─── Chat-Session ─────────────────────────────────────────────────────────────

/**
 * Konvertiert Chat-Messages in das Gemini-History-Format.
 * Ignoriert Streaming-Nachrichten und leere Nachrichten.
 */
function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages
    .filter((m) => !m.isStreaming && m.content.trim())
    .map((m): GeminiHistoryEntry => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));
}

/**
 * Sendet eine Nachricht an Gemini und gibt die Antwort als vollständigen String zurück.
 *
 * @param userMessage - Die neue Benutzernachricht
 * @param history - Vorherige Nachrichten für den Kontext
 * @returns Die Antwort des Modells als String
 */
export async function sendMessage(
  userMessage: string,
  history: ChatMessage[],
): Promise<string> {
  const client = createGeminiClient();

  if (!client) {
    throw new Error('API_KEY_MISSING');
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // Letzte Nachricht aus der History ausschließen (das ist die aktuelle User-Nachricht)
  const historyWithoutLast = history.filter((m) => !m.isStreaming);

  const chat = model.startChat({
    history: toGeminiHistory(historyWithoutLast),
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}

/**
 * Sendet eine Nachricht an Gemini mit Streaming-Antwort.
 *
 * @param userMessage - Die neue Benutzernachricht
 * @param history - Vorherige Nachrichten für den Kontext
 * @param onChunk - Callback für jeden Text-Chunk
 * @returns Die vollständige Antwort als String
 */
export async function sendMessageStreaming(
  userMessage: string,
  history: ChatMessage[],
  onChunk: (chunk: string, fullText: string) => void,
): Promise<string> {
  const client = createGeminiClient();

  if (!client) {
    throw new Error('API_KEY_MISSING');
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const historyWithoutStreaming = history.filter((m) => !m.isStreaming);

  const chat = model.startChat({
    history: toGeminiHistory(historyWithoutStreaming),
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  const result = await chat.sendMessageStream(userMessage);

  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText, fullText);
  }

  return fullText;
}
