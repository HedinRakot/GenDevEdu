import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { sendMessageStreaming } from '@/api/gemini';
import {
  appendChatMessage,
  clearChatHistory,
  getChatHistory,
  updateChatMessage,
} from '@/store/storage';
import { GEMINI_API_KEY } from '@/config/env';
import type { ChatMessage } from '@/types/chat';
import { useTheme } from '@/context/ThemeContext';
import { useSnippets } from '@/hooks/useSnippets';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

interface BubbleProps {
  message: ChatMessage;
  onFavorite: (msg: ChatMessage) => void;
  isFavorited: boolean;
}

function ChatBubble({ message, onFavorite, isFavorited }: BubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleWrapper, isUser && styles.bubbleWrapperUser]}>
      {!isUser && (
        <View style={[styles.aiAvatar, { backgroundColor: colors.primarySurface }]}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.chatUserBubble, borderBottomRightRadius: Radius.xs }
            : { backgroundColor: colors.chatAiBubble, borderBottomLeftRadius: Radius.xs },
        ]}
      >
        {message.isStreaming && message.content.length === 0 ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : isUser ? (
          <Text style={[styles.bubbleText, { color: colors.chatUserText }]}>{message.content}</Text>
        ) : (
          <MarkdownRenderer content={message.content || '...'} />
        )}

        <View style={styles.bubbleFooter}>
          <Text
            style={[
              styles.bubbleTime,
              { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textTertiary },
            ]}
          >
            {time}
          </Text>
          {!isUser && !message.isStreaming && message.content.length > 0 && (
            <TouchableOpacity onPress={() => onFavorite(message)} hitSlop={8}>
              <Text style={[styles.favStar, { color: isFavorited ? colors.accent : colors.textTertiary }]}>
                {isFavorited ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export function ChatScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { snippets, save: saveSnippet } = useSnippets();
  const isApiKeySet = GEMINI_API_KEY.length > 0;

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    if (!isApiKeySet) {
      Alert.alert('API-Key', t('chat.apiKeyMissing'));
      return;
    }

    setInputText('');
    setIsSending(true);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
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
    history = await getChatHistory();
    setMessages(history);
    scrollToBottom();

    let finalText = '';
    try {
      await sendMessageStreaming(
        text,
        history.filter((m) => m.id !== aiMessageId),
        (_chunk, fullText) => {
          finalText = fullText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, content: fullText, isStreaming: true } : m,
            ),
          );
        },
      );

      await updateChatMessage(aiMessageId, finalText || '...');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error && err.message === 'API_KEY_MISSING'
          ? t('chat.apiKeyMissing')
          : t('chat.errorSending');
      await updateChatMessage(aiMessageId, `⚠️ ${errorMsg}`);
    } finally {
      const updatedHistory = await getChatHistory();
      setMessages(updatedHistory);
      setIsSending(false);
      scrollToBottom();
    }
  }, [inputText, isSending, isApiKeySet, t, scrollToBottom]);

  const handleFavorite = useCallback(
    async (message: ChatMessage) => {
      const already = snippets.find((s) => s.refId === message.id);
      if (already) {
        Alert.alert(t('snippets.alreadyExists'));
        return;
      }
      await saveSnippet({
        title: message.content.slice(0, 60).replace(/\n/g, ' ') + (message.content.length > 60 ? '…' : ''),
        content: message.content,
        source: 'chat',
        refId: message.id,
        tags: ['chat'],
      });
      Alert.alert(t('snippets.saved'));
    },
    [snippets, saveSnippet, t],
  );

  const handleClearHistory = () => {
    Alert.alert(t('chat.clearHistory'), t('chat.clearConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await clearChatHistory();
          setMessages([]);
        },
      },
    ]);
  };

  const favoritedIds = useMemo(() => new Set(snippets.map((s) => s.refId)), [snippets]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('chat.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {t('chat.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={handleClearHistory}
        >
          <Text style={styles.clearButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {!isApiKeySet && (
        <View style={[styles.apiKeyWarning, { backgroundColor: colors.warningSurface }]}>
          <Text style={[styles.apiKeyWarningText, { color: colors.warning }]}>
            ⚠️ {t('chat.apiKeyMissing')}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤖</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('chat.emptyState')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onFavorite={handleFavorite}
                isFavorited={favoritedIds.has(item.id)}
              />
            )}
            onContentSizeChange={scrollToBottom}
          />
        )}

        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: !inputText.trim() || isSending ? colors.border : colors.primary,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.textInverted} />
            ) : (
              <Text style={[styles.sendIcon, { color: colors.textInverted }]}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  headerSubtitle: { fontSize: FontSize.sm },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: { fontSize: 18 },

  apiKeyWarning: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  apiKeyWarningText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },

  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm },

  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  bubbleWrapperUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiAvatarText: { fontSize: 16 },
  bubble: { maxWidth: '78%', borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  bubbleText: { fontSize: FontSize.md, lineHeight: 22 },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bubbleTime: { fontSize: FontSize.xs, textAlign: 'right' },
  favStar: { fontSize: 18, marginLeft: Spacing.sm },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  sendIcon: { fontSize: 20, fontWeight: FontWeight.bold },
});
