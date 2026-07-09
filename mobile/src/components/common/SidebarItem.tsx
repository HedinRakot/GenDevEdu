import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/config/theme';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

interface SidebarItemProps {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/**
 * Navigationszeile der Desktop-/Web-Sidebar. Aktiv = Primär-Surface-Hintergrund
 * + Akzent-Icon, analog zum aktiven Tab-Pill auf dem Phone.
 */
export function SidebarItem({ icon, label, active = false, onPress }: SidebarItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm + 4,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: active ? colors.primarySurface : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon
        name={icon}
        size={19}
        color={active ? colors.accent : colors.textSecondary}
        strokeWidth={active ? 2 : 1.75}
      />
      <View style={{ flex: 1 }}>
        <Typography
          variant={active ? 'label' : 'bodySm'}
          color={active ? 'primary' : 'secondary'}
        >
          {label}
        </Typography>
      </View>
    </Pressable>
  );
}
