import React, { useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';

import { useCreatePeriod, useDeletePeriod, usePeriods, useUpdatePeriod } from '@/hooks/useAttendance';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useTheme } from '@/context/ThemeContext';
import type { TrainingPeriod } from '@/types/attendance';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

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
        <TouchableOpacity
          onPress={openNew}
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          testID="period-new"
        >
          <Text style={{ color: colors.textInverted, fontWeight: FontWeight.semibold }}>
            + {t('attendance.periods.new')}
          </Text>
        </TouchableOpacity>
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
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {emailByUserId.get(item.userId) ?? item.userId}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {item.startDate} – {item.endDate} · {item.requiredMinutesPerDay} min/{t('attendance.periods.day')}
                  {item.label ? ` · ${item.label}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.rowAction}>
                <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>
                  {t('common.edit')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deletePeriod.mutate(item.id)} style={styles.rowAction}>
                <Text style={{ color: colors.error, fontWeight: FontWeight.semibold }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {t('attendance.periods.empty')}
            </Text>
          }
        />
      )}

      {/* Formular */}
      <Modal visible={form !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {form?.id ? t('attendance.periods.edit') : t('attendance.periods.new')}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('attendance.periods.learner')}
            </Text>
            <TouchableOpacity
              onPress={() => setUserPickerOpen(true)}
              style={[styles.input, { borderColor: colors.border }]}
            >
              <Text style={{ color: form?.userId ? colors.textPrimary : colors.textSecondary }}>
                {form?.userId
                  ? (emailByUserId.get(form.userId) ?? form.userId)
                  : t('attendance.periods.pickLearner')}
              </Text>
            </TouchableOpacity>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('attendance.from')}
                </Text>
                <TextInput
                  value={form?.startDate}
                  onChangeText={field('startDate')}
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
                  value={form?.endDate}
                  onChangeText={field('endDate')}
                  placeholder="yyyy-mm-dd"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('attendance.periods.minutesPerDay')}
                </Text>
                <TextInput
                  value={form?.requiredMinutesPerDay}
                  onChangeText={field('requiredMinutesPerDay')}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  {t('attendance.periods.label')}
                </Text>
                <TextInput
                  value={form?.label}
                  onChangeText={field('label')}
                  placeholder={t('attendance.periods.labelPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>
            </View>

            {errorMsg && <Text style={{ color: colors.error, fontSize: FontSize.sm }}>{errorMsg}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setForm(null)} style={styles.modalButton}>
                <Text style={{ color: colors.textSecondary, fontWeight: FontWeight.semibold }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submit}
                disabled={createPeriod.isPending || updatePeriod.isPending || !form?.userId}
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

      {/* Lerner-Auswahl */}
      <Modal visible={userPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.pickerCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('attendance.periods.pickLearner')}
            </Text>
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
                  <Text style={{ color: colors.textPrimary }}>{item.email || item.id}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setUserPickerOpen(false)} style={styles.modalButton}>
              <Text style={{ color: colors.textSecondary, fontWeight: FontWeight.semibold }}>
                {t('common.cancel')}
              </Text>
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
  newButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
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
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  rowSubtitle: { fontSize: FontSize.sm },
  rowAction: { padding: Spacing.xs },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  pickerCard: { maxHeight: '70%' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
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
  pickerRow: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  modalButton: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  modalPrimary: { borderRadius: Radius.md },
});
