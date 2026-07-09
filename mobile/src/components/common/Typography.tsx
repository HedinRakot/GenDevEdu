import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { FontFamily, FontSize, LineHeight } from '@/config/theme';

/**
 * Zentrale Text-Komponente der „Akademie"-Typografie.
 * display/h1–h3 → Source Serif 4 (Headlines) · body/label/caption → Instrument Sans · code → IBM Plex Mono.
 * Ersetzt Ad-hoc-<Text style={[...]}> und trägt die Serif/Sans/Mono-Zuordnung an einer Stelle.
 */
export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'code';

type ColorRole = 'primary' | 'secondary' | 'tertiary' | 'inverted' | 'accent';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorRole | string;
  center?: boolean;
}

const VARIANT_STYLE: Record<TypographyVariant, TextStyle> = {
  display: { fontFamily: FontFamily.serifBold, fontSize: FontSize.display, lineHeight: FontSize.display * LineHeight.tight },
  h1: { fontFamily: FontFamily.serifSemibold, fontSize: FontSize.xxxl, lineHeight: FontSize.xxxl * LineHeight.tight },
  h2: { fontFamily: FontFamily.serifSemibold, fontSize: FontSize.xxl, lineHeight: FontSize.xxl * LineHeight.tight },
  h3: { fontFamily: FontFamily.serifSemibold, fontSize: FontSize.xl, lineHeight: FontSize.xl * LineHeight.tight },
  body: { fontFamily: FontFamily.sans, fontSize: FontSize.md, lineHeight: FontSize.md * LineHeight.relaxed },
  bodySm: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, lineHeight: FontSize.sm * LineHeight.normal },
  label: { fontFamily: FontFamily.sansSemibold, fontSize: FontSize.sm, lineHeight: FontSize.sm * LineHeight.normal },
  caption: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, lineHeight: FontSize.xs * LineHeight.normal },
  code: { fontFamily: FontFamily.mono, fontSize: FontSize.sm, lineHeight: FontSize.sm * LineHeight.normal },
};

export function Typography({
  variant = 'body',
  color = 'primary',
  center,
  style,
  children,
  ...rest
}: TypographyProps) {
  const { colors } = useTheme();

  const resolvedColor =
    color === 'primary'
      ? colors.textPrimary
      : color === 'secondary'
        ? colors.textSecondary
        : color === 'tertiary'
          ? colors.textTertiary
          : color === 'inverted'
            ? colors.textInverted
            : color === 'accent'
              ? colors.accent
              : color;

  return (
    <Text
      style={[VARIANT_STYLE[variant], { color: resolvedColor }, center && { textAlign: 'center' }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
