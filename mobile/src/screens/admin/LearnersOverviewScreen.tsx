import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useLearners } from '@/hooks/useAdminStats';
import { useTheme } from '@/context/ThemeContext';
import type { AdminLearnerSummary } from '@/types/adminStats';
import type { LearnersStackParamList } from '@/navigation/LearnersStack';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<LearnersStackParamList, 'LearnersOverview'>;
type Filter = 'all' | 'active' | 'inactive';

function LearnerRow({ learner, onPress }: { learner: AdminLearnerSummary; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.activityDot,
          { backgroundColor: learner.active ? colors.success : colors.borderLight },
        ]}
      />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {learner.displayName}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textTertiary }]} numberOfLines={1}>
          {learner.email}
        </Text>
      </View>
      <View style={styles.rowStats}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
          {learner.overallProgressPercent}%
        </Text>
        <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Fortschritt</Text>
      </View>
      <View style={styles.rowStats}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
          {Math.round(learner.totalLearningMinutes / 60)}h
        </Text>
        <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Lernzeit</Text>
      </View>
      <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

/** Teilnehmer-Übersicht: aktiv/inaktiv, Fortschritt, Lernzeit (AuthorOrAdmin). */
export function LearnersOverviewScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { data: learners, isLoading, error, refetch } = useLearners();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = (learners ?? []).filter((l) =>
    filter === 'all' ? true : filter === 'active' ? l.active : !l.active,
  );

  const FILTERS: { label: string; value: Filter }[] = [
    { label: `Alle (${learners?.length ?? 0})`, value: 'all' },
    { label: `🟢 Aktiv (${learners?.filter((l) => l.active).length ?? 0})`, value: 'active' },
    { label: `⚪ Inaktiv (${learners?.filter((l) => !l.active).length ?? 0})`, value: 'inactive' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.value ? colors.primary : colors.surface,
                borderColor: filter === f.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={{
                color: filter === f.value ? 'white' : colors.textPrimary,
                fontWeight: FontWeight.medium,
                fontSize: FontSize.sm,
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!!error && (
        <View style={styles.centered}>
          <Text style={{ color: colors.error }}>Fehler beim Laden</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: colors.primary, fontWeight: FontWeight.semibold }}>
              Erneut versuchen
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LearnerRow
              learner={item}
              onPress={() =>
                navigation.navigate('LearnerStats', {
                  userId: item.userId,
                  displayName: item.displayName,
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Keine Teilnehmer gefunden.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
  activityDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  rowMeta: { fontSize: FontSize.xs, marginTop: 2 },
  rowStats: { alignItems: 'center', minWidth: 64 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs },
  arrow: { fontSize: 24 },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
