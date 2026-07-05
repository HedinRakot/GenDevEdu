/** F14: Gemeinsame UI-Bausteine des Anwesenheits-Bereichs. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import type { DayStatus } from '@/types/attendance';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

export function useStatusColor(): (status: DayStatus) => string {
  const { colors } = useTheme();
  return (status) => {
    switch (status) {
      case 'anwesend':
        return colors.success;
      case 'teilweise':
        return colors.accent;
      case 'fehlend':
        return colors.error;
      case 'entschuldigt':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };
}

export function StatusChip({ status }: { status: DayStatus }) {
  const { t } = useTranslation();
  const statusColor = useStatusColor()(status);
  return (
    <View style={[styles.chip, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
      <Text style={[styles.chipText, { color: statusColor }]}>
        {t(`attendance.status.${status}`)}
      </Text>
    </View>
  );
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return `${d.getHours() < 10 ? '0' : ''}${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
