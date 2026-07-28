import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { Spacing } from '@/config/theme';
import { showScrollIndicator } from '@/utils/platform';

interface ScreenProps {
  children: React.ReactNode;
  /** Inhalt scrollbar machen (Standard: true). */
  scroll?: boolean;
  /** Standard-Innenabstand (Spacing.lg) anwenden. */
  padded?: boolean;
  /** Optionaler fixer Kopfbereich (Breadcrumb/Toolbar) über dem Scroll-Inhalt. */
  header?: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

/**
 * Standardisiert das in jedem Screen wiederholte
 * SafeAreaView + ScrollView + themed background + Padding-Boilerplate.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  header,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const pad: ViewStyle = padded ? { padding: Spacing.lg } : {};

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]} edges={['top']}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={showScrollIndicator}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
