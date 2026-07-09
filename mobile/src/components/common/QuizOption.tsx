import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadow, Spacing } from '@/config/theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export type QuizOptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface QuizOptionProps {
  /** Buchstaben-Badge (A, B, C …). */
  letter: string;
  label: string;
  state?: QuizOptionState;
  disabled?: boolean;
  onPress?: () => void;
}

/**
 * Antwort-Option im Quiz-Fokus-Modus: Buchstaben-Badge + Text, mit Auswahl-/Auswertungszustand
 * (selected = Kupfer-Rahmen, correct = grün, incorrect = rot).
 */
export function QuizOption({ letter, label, state = 'default', disabled, onPress }: QuizOptionProps) {
  const { colors } = useTheme();

  const palette: Record<QuizOptionState, { border: string; bg: string; badgeBg: string; badgeFg: string }> = {
    default: {
      border: colors.border,
      bg: colors.surface,
      badgeBg: 'transparent',
      badgeFg: colors.textTertiary,
    },
    selected: {
      border: colors.primary,
      bg: colors.primarySurface,
      badgeBg: colors.primary,
      badgeFg: colors.textInverted,
    },
    correct: {
      border: colors.success,
      bg: colors.successSurface,
      badgeBg: colors.success,
      badgeFg: colors.textInverted,
    },
    incorrect: {
      border: colors.error,
      bg: colors.errorSurface,
      badgeBg: colors.error,
      badgeFg: colors.textInverted,
    },
  };
  const p = palette[state];
  const active = state !== 'default';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected', disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          borderWidth: active ? 1.5 : 1,
          borderColor: p.border,
          backgroundColor: p.bg,
          borderRadius: Radius.md,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.md,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
        state === 'selected' && Shadow.sm,
      ]}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: active ? 0 : 1.5,
          borderColor: colors.border,
          backgroundColor: p.badgeBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state === 'correct' ? (
          <Icon name="check" size={15} color={p.badgeFg} strokeWidth={2.4} />
        ) : state === 'incorrect' ? (
          <Icon name="close" size={15} color={p.badgeFg} strokeWidth={2.4} />
        ) : (
          <Typography variant="label" style={{ color: p.badgeFg }}>
            {letter}
          </Typography>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="body" color={state === 'default' ? 'secondary' : 'primary'}>
          {label}
        </Typography>
      </View>
    </Pressable>
  );
}
