import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { attendanceExportPaths } from '@/api/attendance';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useTheme } from '@/context/ThemeContext';
import { monthRange, todayIso } from '@/utils/attendanceDates';
import { downloadFile } from '@/utils/downloadFile';
import { Button, Card, Icon, Input, Screen, Typography } from '@/components/common';
import { Radius, Spacing } from '@/config/theme';

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

  return (
    <Screen contentContainerStyle={styles.content}>
      {/* Lerner */}
      <Card>
        <Typography variant="label" color="secondary">
          {t('attendance.periods.learner')}
        </Typography>
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Typography variant="body" color={userId ? 'primary' : 'secondary'}>
            {userId ? (emailByUserId.get(userId) ?? userId) : t('attendance.export.allLearners')}
          </Typography>
        </TouchableOpacity>

        <View style={styles.fieldRow}>
          <Input
            label={t('attendance.from')}
            leftIcon="clock"
            value={from}
            onChangeText={setFrom}
            placeholder="yyyy-mm-dd"
            autoCapitalize="none"
            containerStyle={styles.fieldHalf}
          />
          <Input
            label={t('attendance.to')}
            leftIcon="clock"
            value={to}
            onChangeText={setTo}
            placeholder="yyyy-mm-dd"
            autoCapitalize="none"
            containerStyle={styles.fieldHalf}
          />
        </View>
      </Card>

      {/* CSV */}
      <Card>
        <View style={styles.cardTitleRow}>
          <Icon name="copy" size={20} color={colors.accent} />
          <Typography variant="h3">{t('attendance.export.csvTitle')}</Typography>
        </View>
        <Typography variant="bodySm" color="secondary">
          {t('attendance.export.csvHint')}
        </Typography>
        <Button
          title={t('attendance.export.dailyCsv')}
          variant="primary"
          iconRight="arrow-right"
          fullWidth
          loading={busy === 'daily'}
          disabled={busy !== null}
          onPress={exportDailyCsv}
          testID="export-daily"
        />
        <Button
          title={t('attendance.export.eventsCsv')}
          variant="primary"
          iconRight="arrow-right"
          fullWidth
          loading={busy === 'events'}
          disabled={!userId || busy !== null}
          onPress={exportEventsCsv}
          testID="export-events"
        />
        {!userId && (
          <Typography variant="bodySm" color="secondary">
            {t('attendance.export.eventsNeedsLearner')}
          </Typography>
        )}
      </Card>

      {/* PDF */}
      <Card>
        <View style={styles.cardTitleRow}>
          <Icon name="certificate" size={20} color={colors.accent} />
          <Typography variant="h3">{t('attendance.export.pdfTitle')}</Typography>
        </View>
        <Typography variant="bodySm" color="secondary">
          {t('attendance.export.pdfHint')}
        </Typography>
        <View style={styles.fieldRow}>
          <Input
            label={t('attendance.export.year')}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            containerStyle={styles.fieldHalf}
          />
          <Input
            label={t('attendance.export.month')}
            value={month}
            onChangeText={setMonth}
            keyboardType="numeric"
            containerStyle={styles.fieldHalf}
          />
        </View>
        <Button
          title={t('attendance.export.pdf')}
          variant="primary"
          iconRight="arrow-right"
          fullWidth
          loading={busy === 'pdf'}
          disabled={!userId || busy !== null}
          onPress={exportPdf}
          testID="export-pdf"
        />
        {!userId && (
          <Typography variant="bodySm" color="secondary">
            {t('attendance.export.pdfNeedsLearner')}
          </Typography>
        )}
      </Card>

      {message && (
        <Typography
          variant="label"
          center
          color={message.isError ? colors.error : colors.success}
        >
          {message.text}
        </Typography>
      )}

      {/* Lerner-Auswahl */}
      <Modal visible={pickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Typography variant="h3">{t('attendance.periods.pickLearner')}</Typography>
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
                  <Typography variant="body">{item.email || item.id}</Typography>
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
                  <Typography variant="body" color="secondary">
                    {t('attendance.export.allLearners')}
                  </Typography>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.modalButton}>
              <Typography variant="label" color="secondary">
                {t('common.cancel')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fieldRow: { flexDirection: 'row', gap: Spacing.md },
  fieldHalf: { flex: 1 },
  selectField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
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
