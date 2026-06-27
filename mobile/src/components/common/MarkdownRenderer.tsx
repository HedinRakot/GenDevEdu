import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Markdown, { type RenderRules } from 'react-native-markdown-display';

import { useTheme } from '@/context/ThemeContext';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

interface Props {
  content: string;
  /** Wenn true: Hintergrundfarben für Code-Blöcke werden für Chat-Bubbles invertiert. */
  onUserBubble?: boolean;
}

/**
 * Markdown mit Syntax-Highlighting-fähigen Code-Blöcken (Mono-Font + dunkler Hintergrund).
 * Für eine echte Syntax-Highlight-Bibliothek wie `react-native-syntax-highlighter` kann das
 * `code_block`-Render-Rule unten ersetzt werden.
 */
export function MarkdownRenderer({ content, onUserBubble = false }: Props) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: onUserBubble ? colors.chatUserText : colors.textPrimary,
          fontSize: FontSize.md,
          lineHeight: 22,
        },
        heading1: {
          color: onUserBubble ? colors.chatUserText : colors.textPrimary,
          fontSize: FontSize.xl,
          fontWeight: FontWeight.bold,
          marginTop: Spacing.sm,
          marginBottom: Spacing.xs,
        },
        heading2: {
          color: onUserBubble ? colors.chatUserText : colors.textPrimary,
          fontSize: FontSize.lg,
          fontWeight: FontWeight.bold,
          marginTop: Spacing.sm,
          marginBottom: Spacing.xs,
        },
        heading3: {
          color: onUserBubble ? colors.chatUserText : colors.textPrimary,
          fontSize: FontSize.md,
          fontWeight: FontWeight.bold,
          marginTop: Spacing.xs,
        },
        paragraph: {
          color: onUserBubble ? colors.chatUserText : colors.textPrimary,
          marginTop: 0,
          marginBottom: Spacing.sm,
        },
        bullet_list: { marginVertical: Spacing.xs },
        ordered_list: { marginVertical: Spacing.xs },
        list_item: { color: onUserBubble ? colors.chatUserText : colors.textPrimary },
        link: {
          color: colors.primary,
          textDecorationLine: 'underline',
        },
        strong: { fontWeight: FontWeight.bold },
        em: { fontStyle: 'italic' },

        // Inline-Code
        code_inline: {
          backgroundColor: colors.surfaceElevated,
          color: colors.textPrimary,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: Radius.xs,
          fontFamily: 'Courier',
          fontSize: FontSize.sm,
        },

        // Code-Block (fenced)
        fence: {
          backgroundColor: colors.codeBackground,
          color: colors.codeText,
          padding: Spacing.md,
          borderRadius: Radius.md,
          fontFamily: 'Courier',
          fontSize: FontSize.sm,
          lineHeight: 20,
          marginVertical: Spacing.xs,
        },
        code_block: {
          backgroundColor: colors.codeBackground,
          color: colors.codeText,
          padding: Spacing.md,
          borderRadius: Radius.md,
          fontFamily: 'Courier',
          fontSize: FontSize.sm,
          marginVertical: Spacing.xs,
        },

        blockquote: {
          backgroundColor: colors.surfaceElevated,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
          paddingLeft: Spacing.md,
          paddingVertical: Spacing.xs,
          marginVertical: Spacing.xs,
        },
        hr: {
          backgroundColor: colors.border,
          height: 1,
          marginVertical: Spacing.sm,
        },
      }),
    [colors, onUserBubble],
  );

  // Custom-Renderer für fenced Code-Blöcke mit Sprach-Label
  const rules = useMemo<RenderRules>(
    () => ({
      fence: (node, _children, _parent, _style) => {
        const language: string | undefined = (node as { sourceInfo?: string }).sourceInfo;
        const codeText: string = (node as { content?: string }).content ?? '';

        const labelStyle: TextStyle = {
          color: colors.codeText,
          opacity: 0.6,
          fontSize: FontSize.xs,
          fontFamily: 'Courier',
          marginBottom: Spacing.xs,
        };

        return (
          <View
            key={node.key}
            style={{
              backgroundColor: colors.codeBackground,
              padding: Spacing.md,
              borderRadius: Radius.md,
              marginVertical: Spacing.xs,
            }}
          >
            {language ? <Text style={labelStyle}>{language.toUpperCase()}</Text> : null}
            <Text
              style={{
                color: colors.codeText,
                fontFamily: 'Courier',
                fontSize: FontSize.sm,
                lineHeight: 20,
              }}
              selectable
            >
              {codeText.replace(/\n$/, '')}
            </Text>
          </View>
        );
      },
    }),
    [colors],
  );

  return (
    <Markdown style={styles} rules={rules}>
      {content}
    </Markdown>
  );
}
