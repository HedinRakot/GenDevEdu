import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { ChatContext } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';
import { useChat } from '@/hooks/useChat';
import { useTheme } from '@/context/ThemeContext';
import { useSnippets } from '@/hooks/useSnippets';
import { ChatBubble, Icon, Typography } from '@/components/common';
import { FontFamily, FontSize, Radius, Shadow, Spacing } from '@/config/theme';

interface MessageRowProps {
  message: ChatMessage;
  onFavorite: (msg: ChatMessage) => void;
  isFavorited: boolean;
}

function MessageRow({ message, onFavorite, isFavorited }: MessageRowProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';
  const role: 'user' | 'ai' = isUser ? 'user' : 'ai';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isEmptyStreaming = message.isStreaming === true && message.content.length === 0;

  return (
    <View style={styles.messageRow}>
      {isEmptyStreaming ? (
        <View style={styles.streamingRow}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="chat" size={16} color={colors.accent} strokeWidth={1.75} />
          </View>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      ) : (
        <ChatBubble role={role} content={isUser ? message.content : message.content || '...'} />
      )}

      {!isUser && message.sources && message.sources.length > 0 && (
        <View style={styles.sourceRow}>
          {message.sources.map((s, i) => (
            <View
              key={`${s.chapterId}-${i}`}
              style={[styles.sourceChip, { backgroundColor: colors.primarySurface }]}
            >
              <Icon name="courses" size={12} color={colors.primary} strokeWidth={1.75} />
              <Typography variant="caption" color={colors.primary} numberOfLines={1}>
                {s.title}
              </Typography>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footer, isUser ? styles.footerUser : styles.footerAi]}>
        <Typography variant="caption" color="tertiary">
          {time}
        </Typography>
        {!isUser && !message.isStreaming && message.content.length > 0 && (
          <TouchableOpacity onPress={() => onFavorite(message)} hitSlop={8}>
            <Icon
              name="snippets"
              size={16}
              color={isFavorited ? colors.accent : colors.textTertiary}
              strokeWidth={1.75}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function ChatScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const route = useRoute();
  const params = route.params as
    | { context?: ChatContext; seed?: string; seedNonce?: number }
    | undefined;
  const context = params?.context;
  const seed = params?.seed;
  const seedNonce = params?.seedNonce;
  const [inputText, setInputText] = useState('');
  const { messages, isSending, sendMessage: sendChat, clearHistory } = useChat();
  const { snippets, save: saveSnippet } = useSnippets();
  const lastSeedNonce = useRef<number | undefined>(undefined);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // B7: Aus einem Screen mit vorformulierter Frage kommen (z. B. „Warum falsch?") —
  // einmal je Navigation (seedNonce) automatisch absenden.
  useEffect(() => {
    if (seed && seedNonce !== undefined && lastSeedNonce.current !== seedNonce) {
      lastSeedNonce.current = seedNonce;
      void sendChat(seed, context ? { context } : undefined).then(scrollToBottom);
    }
  }, [seed, seedNonce, context, sendChat, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    await sendChat(text, context ? { context } : undefined);
    scrollToBottom();
  }, [inputText, isSending, sendChat, scrollToBottom, context]);

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
          await clearHistory();
        },
      },
    ]);
  };

  const favoritedIds = useMemo(() => new Set(snippets.map((s) => s.refId)), [snippets]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Typography variant="h3" color="primary">
            {t('chat.title')}
          </Typography>
          <Typography variant="bodySm" color="tertiary">
            {t('chat.subtitle')}
          </Typography>
        </View>
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={handleClearHistory}
        >
          <Icon name="delete" size={20} color={colors.textSecondary} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>

      {context && (
        <View
          testID="chat-context-banner"
          style={[styles.contextBanner, { backgroundColor: colors.accentSurface }]}
        >
          <Typography variant="label" color="accent">
            {t('chat.contextBanner')}
          </Typography>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="chat" size={64} color={colors.accent} strokeWidth={1.5} />
            <Typography variant="body" color="secondary" center style={styles.emptyText}>
              {t('chat.emptyState')}
            </Typography>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MessageRow
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
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: !inputText.trim() || isSending ? colors.border : colors.primary,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.textInverted} />
            ) : (
              <Icon name="arrow-right" size={20} color={colors.textInverted} strokeWidth={2} />
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contextBanner: {
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyText: { lineHeight: 24 },

  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm },

  messageRow: { marginBottom: Spacing.md },
  streamingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm + 2,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footerUser: { alignSelf: 'flex-end' },
  footerAi: { paddingLeft: 42 },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingLeft: 42,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    maxWidth: 220,
  },

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
    fontFamily: FontFamily.sans,
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
});
