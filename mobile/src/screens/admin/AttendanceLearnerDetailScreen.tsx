import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { AttendanceStackParamList } from '@/navigation/AttendanceStack';
import { useCreateExcuse, useDeleteExcuse, useExcuses, useLearnerDays } from '@/hooks/useAttendance';
import { useTheme } from '@/context/ThemeContext';
import type { DailyAttendance, ExcuseReason } from '@/types/attendance';
import { minIso, monthRange, todayIso } from '@/utils/attendanceDates';
import { formatTime, StatusChip } from './attendanceUi';
import { Button, Icon, Input, Typography } from '@/components/common';
import { Radius, Shadow, Spacing } from '@/config/theme';

const REASONS: ExcuseReason[] = ['krank', 'urlaub', 'feiertag', 'sonstig'];

function DayRow({
  day,
  locale,
  onExcuse,
  onRemoveExcuse,
}: {
  day: DailyAttendance;
  locale: string;
  onExcuse: () => void;
  onRemoveExcuse?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dateLabel = new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <View style={[styles.dayRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.dayHeader}>
        <Typography variant="label">{dateLabel}</Typography>
        <StatusChip status={day.status} />
      </View>
      <View style={styles.dayDetails}>
        <Typography variant="bodySm" color="secondary">
          {t('attendance.minutesOf', { minutes: day.minutes, required: day.requiredMinutes })}
        </Typography>
        <Typography variant="code" color="secondary">
          {formatTime(day.firstActivityUtc)} – {formatTime(day.lastActivityUtc)}
        </Typography>
      </View>
      {day.excuseNote ? (
        <View style={styles.noteRow}>
          <Icon name="message" size={14} color={colors.textSecondary} />
          <Typography variant="bodySm" color="secondary" numberOfLines={2} style={{ flex: 1 }}>
            {day.excuseNote}
          </Typography>
        </View>
      ) : null}
      {day.status !== 'keinSolltag' && (
        <View style={styles.dayActions}>
          {day.excuseReason ? (
            onRemoveExcuse && (
              <Button
                title={t('attendance.removeExcuse')}
                variant="destructive"
                size="sm"
                onPress={onRemoveExcuse}
              />
            )
          ) : (
            <Button
              title={t('attendance.excuseAction')}
              variant="ghost"
              size="sm"
              onPress={onExcuse}
            />
          )}
        </View>
      )}
    </View>
  );
}

export function AttendanceLearnerDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AttendanceStackParamList, 'AttendanceLearnerDetail'>>();
  const { userId, displayName } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: displayName });
  }, [navigation, displayName]);

  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const range = monthRange(month.year, month.month);
  // Zukunftstage nicht anzeigen — sie wären irreführend als "fehlend" gelistet.
  const to = minIso(range.to, todayIso());
  const from = range.from;

  const { data: days, isLoading, error } = useLearnerDays(userId, from, to);
  const { data: excuses } = useExcuses(userId, from, to);
  const createExcuse = useCreateExcuse();
  const deleteExcuse = useDeleteExcuse();

  const excuseIdByDate = useMemo(
    () => new Map((excuses ?? []).map((e) => [e.date, e.id])),
    [excuses],
  );

  // Entschuldigungs-Dialog
  const [excuseDay, setExcuseDay] = useState<string | null>(null);
  const [excuseTo, setExcuseTo] = useState('');
  const [reason, setReason] = useState<ExcuseReason>('krank');
  const [note, setNote] = useState('');

  const openExcuse = (date: string) => {
    setExcuseDay(date);
    setExcuseTo(date);
    setReason('krank');
    setNote('');
  };

  const submitExcuse = () => {
    if (!excuseDay) return;
    createExcuse.mutate(
      {
        userId,
        from: excuseDay,
        to: excuseTo || excuseDay,
        reason,
        note: note.trim() || undefined,
      },
      { onSuccess: () => setExcuseDay(null) },
    );
  };

  const monthLabel = new Date(month.year, month.month - 1, 1).toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  });
  const isCurrentMonth =
    month.year === now.getFullYear() && month.month === now.getMonth() + 1;

  const shiftMonth = (delta: number) => {
    const d = new Date(month.year, month.month - 1 + delta, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  // Neueste Tage zuerst
  const sortedDays = [...(days ?? [])].reverse();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.monthBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.monthArrow}>
          <Icon name="chevron-left" size={24} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Typography variant="label" style={styles.monthText}>
          {monthLabel}
        </Typography>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthArrow} disabled={isCurrentMonth}>
          <Icon
            name="chevron-right"
            size={24}
            color={isCurrentMonth ? colors.border : colors.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Typography variant="body" color={colors.error}>
            {t('attendance.loadError')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={sortedDays}
          keyExtractor={(d) => d.date}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DayRow
              day={item}
              locale={i18n.language}
              onExcuse={() => openExcuse(item.date)}
              onRemoveExcuse={
                excuseIdByDate.has(item.date)
                  ? () => deleteExcuse.mutate(excuseIdByDate.get(item.date)!)
                  : undefined
              }
            />
          )}
          ListEmptyComponent={
            <Typography variant="body" color="secondary" center style={styles.empty}>
              {t('attendance.emptyDetail')}
            </Typography>
          }
        />
      )}

      {/* Entschuldigungs-Dialog */}
      <Modal visible={excuseDay !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Typography variant="h3">{t('attendance.excuseTitle')}</Typography>

            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <Typography variant="label" color="secondary">
                  {t('attendance.from')}
                </Typography>
                <Typography variant="body" style={styles.fieldStatic}>
                  {excuseDay}
                </Typography>
              </View>
              <Input
                label={t('attendance.to')}
                leftIcon="clock"
                value={excuseTo}
                onChangeText={setExcuseTo}
                placeholder="yyyy-mm-dd"
                autoCapitalize="none"
                containerStyle={styles.rangeField}
              />
            </View>

            <View style={styles.reasonRow}>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setReason(r)}
                  style={[
                    styles.reasonPill,
                    {
                      backgroundColor: reason === r ? colors.primary : colors.background,
                      borderColor: reason === r ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Typography
                    variant="label"
                    color={reason === r ? 'inverted' : 'secondary'}
                  >
                    {t(`attendance.reasons.${r}`)}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              value={note}
              onChangeText={setNote}
              placeholder={t('attendance.excuseNotePlaceholder')}
              multiline
              style={styles.noteInput}
            />

            {createExcuse.isError && (
              <Typography variant="bodySm" color={colors.error}>
                {t('attendance.saveError')}
              </Typography>
            )}

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="ghost"
                onPress={() => setExcuseDay(null)}
              />
              <Button
                title={t('common.save')}
                variant="primary"
                loading={createExcuse.isPending}
                disabled={createExcuse.isPending}
                onPress={submitExcuse}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  monthArrow: { paddingHorizontal: Spacing.lg },
  monthText: { minWidth: 140, textAlign: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  dayRow: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dayActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  empty: { marginTop: Spacing.xxxl },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  rangeRow: { flexDirection: 'row', gap: Spacing.md },
  rangeField: { flex: 1, gap: Spacing.xs },
  fieldStatic: { paddingVertical: Spacing.sm },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  reasonRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  reasonPill: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
});
