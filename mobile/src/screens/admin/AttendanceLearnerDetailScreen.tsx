import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
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
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

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
        <Text style={[styles.dayDate, { color: colors.textPrimary }]}>{dateLabel}</Text>
        <StatusChip status={day.status} />
      </View>
      <View style={styles.dayDetails}>
        <Text style={[styles.dayDetailText, { color: colors.textSecondary }]}>
          {t('attendance.minutesOf', { minutes: day.minutes, required: day.requiredMinutes })}
        </Text>
        <Text style={[styles.dayDetailText, { color: colors.textSecondary }]}>
          {formatTime(day.firstActivityUtc)} – {formatTime(day.lastActivityUtc)}
        </Text>
      </View>
      {day.excuseNote ? (
        <Text style={[styles.dayDetailText, { color: colors.textSecondary }]} numberOfLines={2}>
          💬 {day.excuseNote}
        </Text>
      ) : null}
      {day.status !== 'keinSolltag' && (
        <View style={styles.dayActions}>
          {day.excuseReason ? (
            onRemoveExcuse && (
              <TouchableOpacity onPress={onRemoveExcuse}>
                <Text style={[styles.actionText, { color: colors.error }]}>
                  {t('attendance.removeExcuse')}
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity onPress={onExcuse}>
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {t('attendance.excuseAction')}
              </Text>
            </TouchableOpacity>
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
          <Text style={[styles.monthArrowText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.textPrimary }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthArrow} disabled={isCurrentMonth}>
          <Text style={[styles.monthArrowText, { color: isCurrentMonth ? colors.border : colors.primary }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.error }}>{t('attendance.loadError')}</Text>
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
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {t('attendance.emptyDetail')}
            </Text>
          }
        />
      )}

      {/* Entschuldigungs-Dialog */}
      <Modal visible={excuseDay !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('attendance.excuseTitle')}
            </Text>

            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('attendance.from')}
                </Text>
                <Text style={[styles.fieldStatic, { color: colors.textPrimary }]}>{excuseDay}</Text>
              </View>
              <View style={styles.rangeField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('attendance.to')}
                </Text>
                <TextInput
                  value={excuseTo}
                  onChangeText={setExcuseTo}
                  placeholder="yyyy-mm-dd"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                  autoCapitalize="none"
                />
              </View>
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
                  <Text
                    style={[
                      styles.reasonText,
                      { color: reason === r ? colors.textInverted : colors.textSecondary },
                    ]}
                  >
                    {t(`attendance.reasons.${r}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('attendance.excuseNotePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.noteInput, { color: colors.textPrimary, borderColor: colors.border }]}
              multiline
            />

            {createExcuse.isError && (
              <Text style={{ color: colors.error, fontSize: FontSize.sm }}>
                {t('attendance.saveError')}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setExcuseDay(null)} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary, fontWeight: FontWeight.semibold }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitExcuse}
                disabled={createExcuse.isPending}
                style={[styles.modalButton, styles.modalPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.textInverted, fontWeight: FontWeight.semibold }}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
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
  monthArrowText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  monthText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, minWidth: 140, textAlign: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  dayRow: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayDate: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  dayDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDetailText: { fontSize: FontSize.sm },
  dayActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  rangeRow: { flexDirection: 'row', gap: Spacing.md },
  rangeField: { flex: 1, gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  fieldStatic: { fontSize: FontSize.md, paddingVertical: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  reasonRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  reasonPill: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  reasonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  modalButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  modalPrimary: { borderRadius: Radius.md },
});
