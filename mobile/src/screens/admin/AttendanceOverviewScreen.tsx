import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
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
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

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
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {flagged ? '🚩 ' : ''}
          {item.displayName}
        </Text>
        <StatusChip status={item.status} />
      </View>
      <View style={styles.rowDetails}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {t('attendance.minutesOf', { minutes: item.minutes, required: item.requiredMinutes })}
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {formatTime(item.firstActivityUtc)} – {formatTime(item.lastActivityUtc)}
        </Text>
      </View>
      {inactive7Days && (
        <Text style={[styles.inactiveHint, { color: colors.error }]}>
          {t('attendance.inactive7Days')}
        </Text>
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
          <Text style={[styles.dateArrowText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDate(todayIso())}>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {date === todayIso() ? t('attendance.today') : date}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDate(addDaysIso(date, 1))}
          style={styles.dateArrow}
          disabled={date >= todayIso()}
        >
          <Text
            style={[
              styles.dateArrowText,
              { color: date >= todayIso() ? colors.border : colors.primary },
            ]}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Admin-Schnellzugriffe */}
      {isAdmin && (
        <View style={styles.adminBar}>
          <TouchableOpacity
            style={[styles.adminButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('TrainingPeriods')}
          >
            <Text style={[styles.adminButtonText, { color: colors.textPrimary }]}>
              📅 {t('attendance.periods.title')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('AttendanceExport')}
          >
            <Text style={[styles.adminButtonText, { color: colors.textPrimary }]}>
              📄 {t('attendance.export.title')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.error }}>{t('attendance.loadError')}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
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
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {t('attendance.emptyOverview')}
            </Text>
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
  dateArrowText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  dateText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  adminBar: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 0 },
  adminButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  adminButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  rowDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailText: { fontSize: FontSize.sm },
  inactiveHint: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
