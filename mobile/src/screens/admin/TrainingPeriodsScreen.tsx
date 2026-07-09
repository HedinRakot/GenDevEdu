import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';

import { useCreatePeriod, useDeletePeriod, usePeriods, useUpdatePeriod } from '@/hooks/useAttendance';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useTheme } from '@/context/ThemeContext';
import type { TrainingPeriod } from '@/types/attendance';
import { Button, Icon, Input, Typography } from '@/components/common';
import { Radius, Shadow, Spacing } from '@/config/theme';

interface FormState {
  id?: string;
  userId: string;
  startDate: string;
  endDate: string;
  requiredMinutesPerDay: string;
  label: string;
}

const EMPTY_FORM: FormState = {
  userId: '',
  startDate: '',
  endDate: '',
  requiredMinutesPerDay: '240',
  label: '',
};

export function TrainingPeriodsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: periods, isLoading } = usePeriods();
  const { data: users } = useAdminUsers();
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const deletePeriod = useDeletePeriod();

  const [form, setForm] = useState<FormState | null>(null);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailByUserId = useMemo(
    () => new Map((users ?? []).map((u) => [u.id, u.email || u.id])),
    [users],
  );

  const openNew = () => {
    setErrorMsg(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (p: TrainingPeriod) => {
    setErrorMsg(null);
    setForm({
      id: p.id,
      userId: p.userId,
      startDate: p.startDate,
      endDate: p.endDate,
      requiredMinutesPerDay: String(p.requiredMinutesPerDay),
      label: p.label ?? '',
    });
  };

  const submit = () => {
    if (!form) return;
    setErrorMsg(null);
    const input = {
      userId: form.userId,
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      requiredMinutesPerDay: Number(form.requiredMinutesPerDay) || 0,
      label: form.label.trim() || undefined,
    };
    const onError = (err: unknown) => {
      const serverError =
        isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? (err.response.data.error as string)
          : t('attendance.saveError');
      setErrorMsg(serverError);
    };
    if (form.id) {
      updatePeriod.mutate({ id: form.id, ...input }, { onSuccess: () => setForm(null), onError });
    } else {
      createPeriod.mutate(input, { onSuccess: () => setForm(null), onError });
    }
  };

  const field = (key: keyof FormState) => (value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.toolbar}>
        <Button
          title={t('attendance.periods.new')}
          variant="primary"
          size="sm"
          iconLeft="add"
          onPress={openNew}
          testID="period-new"
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={periods ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={styles.rowMain}>
                <Typography variant="label" numberOfLines={1}>
                  {emailByUserId.get(item.userId) ?? item.userId}
                </Typography>
                <Typography variant="bodySm" color="secondary">
                  {item.startDate} – {item.endDate} · {item.requiredMinutesPerDay} min/{t('attendance.periods.day')}
                  {item.label ? ` · ${item.label}` : ''}
                </Typography>
              </View>
              <Button
                title={t('common.edit')}
                variant="ghost"
                size="sm"
                onPress={() => openEdit(item)}
              />
              <TouchableOpacity onPress={() => deletePeriod.mutate(item.id)} style={styles.rowAction}>
                <Icon name="delete" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Typography variant="body" color="secondary" center style={styles.empty}>
              {t('attendance.periods.empty')}
            </Typography>
          }
        />
      )}

      {/* Formular */}
      <Modal visible={form !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Typography variant="h3">
              {form?.id ? t('attendance.periods.edit') : t('attendance.periods.new')}
            </Typography>

            <View style={{ gap: Spacing.xs }}>
              <Typography variant="label" color="secondary">
                {t('attendance.periods.learner')}
              </Typography>
              <TouchableOpacity
                onPress={() => setUserPickerOpen(true)}
                style={[styles.selectField, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Typography variant="body" color={form?.userId ? 'primary' : 'secondary'}>
                  {form?.userId
                    ? (emailByUserId.get(form.userId) ?? form.userId)
                    : t('attendance.periods.pickLearner')}
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldRow}>
              <Input
                label={t('attendance.from')}
                leftIcon="clock"
                value={form?.startDate}
                onChangeText={field('startDate')}
                placeholder="yyyy-mm-dd"
                autoCapitalize="none"
                containerStyle={styles.fieldHalf}
              />
              <Input
                label={t('attendance.to')}
                leftIcon="clock"
                value={form?.endDate}
                onChangeText={field('endDate')}
                placeholder="yyyy-mm-dd"
                autoCapitalize="none"
                containerStyle={styles.fieldHalf}
              />
            </View>

            <View style={styles.fieldRow}>
              <Input
                label={t('attendance.periods.minutesPerDay')}
                value={form?.requiredMinutesPerDay}
                onChangeText={field('requiredMinutesPerDay')}
                keyboardType="numeric"
                containerStyle={styles.fieldHalf}
              />
              <Input
                label={t('attendance.periods.label')}
                value={form?.label}
                onChangeText={field('label')}
                placeholder={t('attendance.periods.labelPlaceholder')}
                containerStyle={styles.fieldHalf}
              />
            </View>

            {errorMsg && (
              <Typography variant="bodySm" color={colors.error}>
                {errorMsg}
              </Typography>
            )}

            <View style={styles.modalActions}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setForm(null)} />
              <Button
                title={t('common.save')}
                variant="primary"
                loading={createPeriod.isPending || updatePeriod.isPending}
                disabled={createPeriod.isPending || updatePeriod.isPending || !form?.userId}
                onPress={submit}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Lerner-Auswahl */}
      <Modal visible={userPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.pickerCard, { backgroundColor: colors.surface }]}>
            <Typography variant="h3">{t('attendance.periods.pickLearner')}</Typography>
            <FlatList
              data={users ?? []}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setForm((f) => (f ? { ...f, userId: item.id } : f));
                    setUserPickerOpen(false);
                  }}
                  style={[styles.pickerRow, { borderBottomColor: colors.borderLight }]}
                >
                  <Typography variant="body">{item.email || item.id}</Typography>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setUserPickerOpen(false)} style={styles.modalButton}>
              <Typography variant="label" color="secondary">
                {t('common.cancel')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: { padding: Spacing.lg, paddingBottom: 0, alignItems: 'flex-end' },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowAction: { padding: Spacing.xs },
  empty: { marginTop: Spacing.xxxl },
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
  modalCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  pickerCard: { maxHeight: '70%' },
  fieldRow: { flexDirection: 'row', gap: Spacing.md },
  fieldHalf: { flex: 1 },
  pickerRow: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  modalButton: { paddingVertical: Spacing.sm, alignItems: 'flex-end' },
});
