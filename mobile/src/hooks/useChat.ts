import { useCallback, useEffect, useState } from 'react';

import i18n from '@/i18n';
import { sendChatStreaming, type ChatStreamOptions } from '@/api/chat';
import {
  appendChatMessage,
  clearChatHistory,
  getChatHistory,
  updateChatMessage,
} from '@/store/storage';
import type { ChatMessage, ChatSource } from '@/types/chat';

/**
 * Kapselt den Chat-Zustand + Sende-/Streaming-Fluss gegen das Backend
 * (Provider-Key liegt serverseitig). Persistenz über AsyncStorage bleibt erhalten.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  const sendMessage = useCallback(
    async (text: string, opts?: ChatStreamOptions) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      setIsSending(true);

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      await appendChatMessage(userMessage);
      let history = await getChatHistory();
      setMessages(history);

      const aiMessageId = `msg_${Date.now()}_model`;
      await appendChatMessage({
        id: aiMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      });
      setMessages(await getChatHistory());

      let finalText = '';
      let sources: ChatSource[] | undefined;
      try {
        finalText = await sendChatStreaming(
          trimmed,
          history.filter((m) => m.id !== aiMessageId),
          (_chunk, fullText) => {
            finalText = fullText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: fullText, isStreaming: true } : m,
              ),
            );
          },
          { ...opts, onSources: (s) => { sources = s; } },
        );
        await updateChatMessage(aiMessageId, finalText || '...', sources);
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.message === 'UNAUTHORIZED'
            ? i18n.t('chat.errorSending')
            : i18n.t('chat.errorSending');
        await updateChatMessage(aiMessageId, `⚠️ ${msg}`);
      } finally {
        setMessages(await getChatHistory());
        setIsSending(false);
      }
    },
    [isSending],
  );

  const clearHistory = useCallback(async () => {
    await clearChatHistory();
    setMessages([]);
  }, []);

  return { messages, isSending, sendMessage, clearHistory };
}
