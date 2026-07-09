import React, { useState } from 'react';
import { TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { FontFamily, FontSize, Radius, Spacing } from '@/config/theme';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: IconName;
  containerStyle?: ViewStyle;
}

/**
 * Themed Text-Eingabe mit Label, Fokus-Rahmen und Fehlerzustand.
 * Ersetzt rohe <TextInput> in Login/SignUp/Notes-Modal/Autoren-Editoren.
 */
export function Input({
  label,
  error,
  leftIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[{ gap: Spacing.xs }, containerStyle]}>
      {label ? (
        <Typography variant="label" color="secondary">
          {label}
        </Typography>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          borderWidth: 1,
          borderColor,
          borderRadius: Radius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: Spacing.md,
        }}
      >
        {leftIcon ? <Icon name={leftIcon} size={18} color={colors.textTertiary} /> : null}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: Spacing.sm + 2,
              color: colors.textPrimary,
              fontFamily: FontFamily.sans,
              fontSize: FontSize.md,
            },
            style,
          ]}
          {...rest}
        />
      </View>
      {error ? (
        <Typography variant="caption" color="accent" style={{ color: colors.error }}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}
