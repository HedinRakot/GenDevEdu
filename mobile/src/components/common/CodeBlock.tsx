import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { FontFamily, FontSize, LineHeight, Radius, Spacing } from '@/config/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

interface CodeBlockProps {
  code: string;
  /** Sprach-Label (z.B. „js"). */
  language?: string;
  /** Dateiname im Kopfbereich (z.B. „beispiel.js"). */
  filename?: string;
  /** Kopieren-Button anzeigen (Standard: true). */
  showCopy?: boolean;
}

/**
 * Dunkler Code-Block im „Akademie"-Stil: Kopfzeile mit Datei-/Sprach-Label + Kopieren-Button,
 * darunter horizontal scrollbarer Monospace-Code. Wird auch vom MarkdownRenderer-Fence genutzt.
 */
export function CodeBlock({ code, language, filename, showCopy = true }: CodeBlockProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const label = filename ?? (language ? language.toUpperCase() : undefined);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard nicht verfügbar – still ignorieren
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.codeBackground, borderColor: colors.borderLight },
      ]}
    >
      {(label || showCopy) && (
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <Typography variant="code" style={{ color: colors.textTertiary, fontSize: FontSize.xs }}>
            {label ?? ''}
          </Typography>
          {showCopy ? (
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.copyBtn}>
              <Icon name={copied ? 'check' : 'copy'} size={13} color={colors.accent} strokeWidth={2} />
              <Typography variant="code" style={{ color: colors.accent, fontSize: FontSize.xs }}>
                {copied ? t('common.copied', 'Kopiert') : t('common.copy', 'Kopieren')}
              </Typography>
            </Pressable>
          ) : null}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.codeScroll}>
        <Typography
          selectable
          style={{
            color: colors.codeText,
            fontFamily: FontFamily.mono,
            fontSize: FontSize.sm,
            lineHeight: FontSize.sm * LineHeight.relaxed,
          }}
        >
          {code.replace(/\n$/, '')}
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  codeScroll: { padding: Spacing.md },
});
