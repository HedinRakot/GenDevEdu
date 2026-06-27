import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadow, Spacing } from '@/config/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  variant?: 'surface' | 'elevated';
}

export function Card({ padded = true, variant = 'surface', style, children, ...rest }: CardProps) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.surfaceElevated : colors.surface,
    borderRadius: Radius.xl,
    padding: padded ? Spacing.lg : 0,
    ...Shadow.md,
  };
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
