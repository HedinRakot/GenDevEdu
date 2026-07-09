import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import type { AttendanceStackParamList } from '@/navigation/AttendanceStack';
import { useAttendanceOverview, useAttendanceRange } from '@/hooks/useAttendance';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { LearnerDayOverview } from '@/types/attendance';
import { addDaysIso, todayIso } from '@/utils/attendanceDates';
import { formatTime, StatusChip } from './attendanceUi';
import { Button, Icon, Typography } from '@/components/common';
import { Radius, Shadow, Spacing } from '@/config/theme';

type Nav = NativeStackNavigationProp<AttendanceStackParamList, 'AttendanceOverview'>;

function LearnerRow({
  item,
  inactive7Days,
  onPress,
}: {
  item: LearnerDayOverview;
  inactive7Days: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const flagged = item.status === 'fehlend' || inactive7Days;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      testID={`attendance-row-${item.userId}`}
    >
      <View style={styles.rowHeader}>
        <View style={styles.nameWrap}>
          {flagged && <Icon name="x-circle" size={16} color={colors.error} />}
          <Typography variant="label" numberOfLines={1} style={{ flex: 1 }}>
            {item.displayName}
          </Typography>
        </View>
        <StatusChip status={item.status} />
      </View>
      <View style={styles.rowDetails}>
        <Typography variant="bodySm" color="secondary">
          {t('attendance.minutesOf', { minutes: item.minutes, required: item.requiredMinutes })}
        </Typography>
        <Typography variant="code" color="secondary">
          {formatTime(item.firstActivityUtc)} – {formatTime(item.lastActivityUtc)}
        </Typography>
      </View>
      {inactive7Days && (
        <Typography variant="caption" color={colors.error}>
          {t('attendance.inactive7Days')}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

export function AttendanceOverviewScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const isAdmin = user?.role === 'admin';

  const [date, setDate] = useState(todayIso());
  const { data: overview, isLoading, isRefetching, error, refetch } = useAttendanceOverview(date);
  const { data: range } = useAttendanceRange(addDaysIso(todayIso(), -6), todayIso());

  const inactiveByUser = new Set(
    (range ?? []).filter((r) => !r.lastActiveDate).map((r) => r.userId),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Datums-Navigation */}
      <View style={[styles.dateBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setDate(addDaysIso(date, -1))} style={styles.dateArrow}>
          <Icon name="chevron-left" size={24} color={colors.primary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDate(todayIso())}>
          <Typography variant="label">
            {date === todayIso() ? t('attendance.today') : date}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDate(addDaysIso(date, 1))}
          style={styles.dateArrow}
          disabled={date >= todayIso()}
        >
          <Icon
            name="chevron-right"
            size={24}
            color={date >= todayIso() ? colors.border : colors.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Admin-Schnellzugriffe */}
      {isAdmin && (
        <View style={styles.adminBar}>
          <Button
            title={t('attendance.periods.title')}
            variant="secondary"
            size="sm"
            iconLeft="clock"
            onPress={() => navigation.navigate('TrainingPeriods')}
            style={styles.adminButton}
          />
          <Button
            title={t('attendance.export.title')}
            variant="secondary"
            size="sm"
            iconLeft="copy"
            onPress={() => navigation.navigate('AttendanceExport')}
            style={styles.adminButton}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Typography variant="body" color={colors.error}>
            {t('attendance.loadError')}
          </Typography>
          <Button title={t('common.retry')} variant="ghost" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={overview ?? []}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <LearnerRow
              item={item}
              inactive7Days={inactiveByUser.has(item.userId)}
              onPress={() =>
                navigation.navigate('AttendanceLearnerDetail', {
                  userId: item.userId,
                  displayName: item.displayName,
                })
              }
            />
          )}
          ListEmptyComponent={
            <Typography variant="body" color="secondary" center style={styles.empty}>
              {t('attendance.emptyOverview')}
            </Typography>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  dateArrow: { paddingHorizontal: Spacing.lg },
  adminBar: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 0 },
  adminButton: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  nameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: Spacing.xxxl },
});
