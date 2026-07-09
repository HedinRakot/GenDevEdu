import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { FontSize, Radius, Spacing } from '@/config/theme';
import { Typography } from './Typography';

type Tone = 'default' | 'accent' | 'success' | 'error' | 'muted';

interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

/**
 * Kleines Status-Pill (Kapitel-Status, Streak-Label, Quiz-Feedback, „5 min").
 */
export function Badge({ label, tone = 'default', style }: BadgeProps) {
  const { colors } = useTheme();

  const bg: Record<Tone, string> = {
    default: colors.primarySurface,
    accent: colors.accentSurface,
    success: colors.successSurface,
    error: colors.errorSurface,
    muted: colors.surfaceElevated,
  };
  const fg: Record<Tone, string> = {
    default: colors.primary,
    accent: colors.accent,
    success: colors.success,
    error: colors.error,
    muted: colors.textTertiary,
  };

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: bg[tone],
          borderRadius: Radius.full,
          paddingVertical: Spacing.xs / 2,
          paddingHorizontal: Spacing.sm,
        },
        style,
      ]}
    >
      <Typography variant="caption" style={{ color: fg[tone], fontSize: FontSize.xs }}>
        {label}
      </Typography>
    </View>
  );
}
