import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { FontFamily, FontSize, Radius, Spacing } from '@/config/theme';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  style?: ViewStyle;
}

const SIZE: Record<Size, { padV: number; padH: number; font: number }> = {
  sm: { padV: Spacing.xs + 2, padH: Spacing.md, font: FontSize.sm },
  md: { padV: Spacing.sm + 2, padH: Spacing.lg, font: FontSize.md },
  lg: { padV: Spacing.md, padH: Spacing.xl, font: FontSize.lg },
};

/**
 * „Akademie"-Button. Primär = Kupfer-Fill mit dunklem Label (i.d.R. + Pfeil-Icon rechts).
 * Löst die ~304 Ad-hoc-TouchableOpacity-CTAs über die App ab.
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    ghost: 'transparent',
    destructive: colors.errorSurface,
  };
  const fg: Record<Variant, string> = {
    primary: colors.textInverted,
    secondary: colors.textPrimary,
    ghost: colors.primary,
    destructive: colors.error,
  };

  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: s.padV,
    paddingHorizontal: s.padH,
    borderRadius: Radius.md,
    backgroundColor: bg[variant],
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: colors.border,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [container, pressed && !isDisabled && styles.pressed, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg[variant]} />
      ) : (
        <View style={styles.row}>
          {iconLeft ? <Icon name={iconLeft} size={s.font + 2} color={fg[variant]} strokeWidth={2} /> : null}
          <Typography
            variant="label"
            color={fg[variant]}
            style={{ fontFamily: FontFamily.sansSemibold, fontSize: s.font }}
          >
            {title}
          </Typography>
          {iconRight ? <Icon name={iconRight} size={s.font + 2} color={fg[variant]} strokeWidth={2} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pressed: { opacity: 0.8 },
});
