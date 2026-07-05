import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { attendanceExportPaths } from '@/api/attendance';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useTheme } from '@/context/ThemeContext';
import { monthRange, todayIso } from '@/utils/attendanceDates';
import { downloadFile } from '@/utils/downloadFile';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

export function AttendanceExportScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: users } = useAdminUsers();

  const now = new Date();
  const currentMonth = monthRange(now.getFullYear(), now.getMonth() + 1);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState(currentMonth.from);
  const [to, setTo] = useState(todayIso());
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const emailByUserId = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.email || u.id])),
    [users],
  );

  const run = async (kind: string, action: () => Promise<void>) => {
    setBusy(kind);
    setMessage(null);
    try {
      await action();
      setMessage({ text: t('attendance.export.done'), isError: false });
    } catch (e) {
      console.error('[attendance] export failed', e);
      setMessage({ text: t('attendance.export.failed'), isError: true });
    } finally {
      setBusy(null);
    }
  };

  const exportEventsCsv = () =>
    run('events', () =>
      downloadFile(
        attendanceExportPaths.eventsCsv(userId, from, to),
        `events_${from}_${to}.csv`,
        'text/csv',
      ),
    );

  const exportDailyCsv = () =>
    run('daily', () =>
      downloadFile(
        attendanceExportPaths.dailyCsv(from, to, userId || undefined),
        `anwesenheit_${from}_${to}.csv`,
        'text/csv',
      ),
    );

  const exportPdf = () =>
    run('pdf', () =>
      downloadFile(
        attendanceExportPaths.reportPdf(userId, Number(year), Number(month)),
        `anwesenheit_${year}-${month.padStart(2, '0')}.pdf`,
        'application/pdf',
      ),
    );

  const Button = ({
    kind,
    label,
    onPress,
    disabled,
  }: {
    kind: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy !== null}
      style={[
        styles.exportButton,
        { backgroundColor: colors.primary },
        (disabled || busy !== null) && { opacity: 0.5 },
      ]}
      testID={`export-${kind}`}
    >
      {busy === kind ? (
        <ActivityIndicator color={colors.textInverted} size="small" />
      ) : (
        <Text style={{ color: colors.textInverted, fontWeight: FontWeight.semibold }}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Lerner */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {t('attendance.periods.learner')}
        </Text>
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={[styles.input, { borderColor: colors.border }]}
        >
          <Text style={{ color: userId ? colors.textPrimary : colors.textSecondary }}>
            {userId ? (emailByUserId.get(userId) ?? userId) : t('attendance.export.allLearners')}
          </Text>
        </TouchableOpacity>

        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('attendance.from')}
            </Text>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="yyyy-mm-dd"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('attendance.to')}
            </Text>
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="yyyy-mm-dd"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      {/* CSV */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          📊 {t('attendance.export.csvTitle')}
        </Text>
        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
          {t('attendance.export.csvHint')}
        </Text>
        <Button
          kind="daily"
          label={t('attendance.export.dailyCsv')}
          onPress={exportDailyCsv}
        />
        <Button
          kind="events"
          label={t('attendance.export.eventsCsv')}
          onPress={exportEventsCsv}
          disabled={!userId}
        />
        {!userId && (
          <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
            {t('attendance.export.eventsNeedsLearner')}
          </Text>
        )}
      </View>

      {/* PDF */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          📄 {t('attendance.export.pdfTitle')}
        </Text>
        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
          {t('attendance.export.pdfHint')}
        </Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('attendance.export.year')}
            </Text>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('attendance.export.month')}
            </Text>
            <TextInput
              value={month}
              onChangeText={setMonth}
              keyboardType="numeric"
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            />
          </View>
        </View>
        <Button kind="pdf" label={t('attendance.export.pdf')} onPress={exportPdf} disabled={!userId} />
        {!userId && (
          <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
            {t('attendance.export.pdfNeedsLearner')}
          </Text>
        )}
      </View>

      {message && (
        <Text
          style={[
            styles.message,
            { color: message.isError ? colors.error : colors.success },
          ]}
        >
          {message.text}
        </Text>
      )}

      {/* Lerner-Auswahl */}
      <Modal visible={pickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('attendance.periods.pickLearner')}
            </Text>
            <FlatList
              data={users ?? []}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setUserId(item.id);
                    setPickerOpen(false);
                  }}
                  style={[styles.pickerRow, { borderBottomColor: colors.borderLight }]}
                >
                  <Text style={{ color: colors.textPrimary }}>{item.email || item.id}</Text>
                </TouchableOpacity>
              )}
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => {
                    setUserId('');
                    setPickerOpen(false);
                  }}
                  style={[styles.pickerRow, { borderBottomColor: colors.borderLight }]}
                >
                  <Text style={{ color: colors.textSecondary }}>
                    {t('attendance.export.allLearners')}
                  </Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.modalButton}>
              <Text style={{ color: colors.textSecondary, fontWeight: FontWeight.semibold }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  cardHint: { fontSize: FontSize.sm },
  fieldRow: { flexDirection: 'row', gap: Spacing.md },
  fieldHalf: { flex: 1, gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  exportButton: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  message: { textAlign: 'center', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, maxHeight: '70%' },
  pickerRow: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  modalButton: { paddingVertical: Spacing.sm, alignItems: 'flex-end' },
});
