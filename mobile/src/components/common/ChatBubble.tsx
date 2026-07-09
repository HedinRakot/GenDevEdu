import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/config/theme';
import { Icon } from './Icon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Typography } from './Typography';

interface ChatBubbleProps {
  role: 'user' | 'ai';
  content: string;
  /** Vorschlags-Chips unter einer AI-Antwort. */
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
}

/**
 * Chat-Bubble im „Akademie"-Stil.
 * User = gefüllte Bubble rechts · AI = Avatar links + Markdown-Antwort + optionale Vorschlags-Chips.
 */
export function ChatBubble({ role, content, suggestions, onSuggestionPress }: ChatBubbleProps) {
  const { colors } = useTheme();

  if (role === 'user') {
    return (
      <View
        style={{
          alignSelf: 'flex-end',
          maxWidth: '85%',
          backgroundColor: colors.chatUserBubble,
          borderRadius: Radius.lg,
          borderBottomRightRadius: Radius.xs,
          paddingVertical: Spacing.sm + 2,
          paddingHorizontal: Spacing.md,
        }}
      >
        <MarkdownRenderer content={content} onUserBubble />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm + 2, alignSelf: 'flex-start', maxWidth: '92%' }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chat" size={16} color={colors.accent} strokeWidth={1.75} />
      </View>
      <View style={{ flex: 1, gap: Spacing.sm }}>
        <MarkdownRenderer content={content} />
        {suggestions && suggestions.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {suggestions.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={() => onSuggestionPress?.(s)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: colors.accentSurface,
                  borderRadius: Radius.full,
                  paddingVertical: Spacing.xs + 1,
                  paddingHorizontal: Spacing.md,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Typography variant="caption" color="accent">
                  {s}
                </Typography>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
