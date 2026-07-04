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
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { ChatContext } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';
import { useChat } from '@/hooks/useChat';
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

        {!isUser && message.sources && message.sources.length > 0 && (
          <View style={styles.sourceRow}>
            {message.sources.map((s, i) => (
              <View key={`${s.chapterId}-${i}`} style={[styles.sourceChip, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.sourceChipText, { color: colors.primary }]} numberOfLines={1}>
                  📄 {s.title}
                </Text>
              </View>
            ))}
          </View>
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

      {context && (
        <View testID="chat-context-banner" style={[styles.contextBanner, { backgroundColor: colors.primarySurface }]}>
          <Text style={[styles.contextBannerText, { color: colors.primary }]}>
            {t('chat.contextBanner')}
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
  contextBanner: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  contextBannerText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },

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
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  sourceChip: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, maxWidth: 200 },
  sourceChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

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
