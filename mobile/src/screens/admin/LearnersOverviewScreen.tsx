import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
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
import { Button, Card, Icon, Typography } from '@/components/common';
import { Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<LearnersStackParamList, 'LearnersOverview'>;
type Filter = 'all' | 'active' | 'inactive';

function LearnerRow({ learner, onPress }: { learner: AdminLearnerSummary; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.row}>
        <View
          style={[
            styles.activityDot,
            { backgroundColor: learner.active ? colors.success : colors.borderLight },
          ]}
        />
        <View style={styles.rowBody}>
          <Typography variant="label" numberOfLines={1}>
            {learner.displayName}
          </Typography>
          <Typography variant="caption" color="tertiary" numberOfLines={1}>
            {learner.email}
          </Typography>
        </View>
        <View style={styles.rowStats}>
          <Typography variant="h3">{learner.overallProgressPercent}%</Typography>
          <Typography variant="caption" color="tertiary">Fortschritt</Typography>
        </View>
        <View style={styles.rowStats}>
          <Typography variant="h3">{Math.round(learner.totalLearningMinutes / 60)}h</Typography>
          <Typography variant="caption" color="tertiary">Lernzeit</Typography>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      </Card>
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
    { label: `Aktiv (${learners?.filter((l) => l.active).length ?? 0})`, value: 'active' },
    { label: `Inaktiv (${learners?.filter((l) => !l.active).length ?? 0})`, value: 'inactive' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const selected = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.7}
            >
              <Typography variant="label" color={selected ? 'inverted' : 'primary'}>
                {f.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!!error && (
        <View style={styles.centered}>
          <Typography variant="body" color={colors.error}>Fehler beim Laden</Typography>
          <Button title="Erneut versuchen" variant="ghost" onPress={() => refetch()} />
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
            <Typography variant="body" color="secondary" center style={styles.empty}>
              Keine Teilnehmer gefunden.
            </Typography>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  activityDot: { width: 10, height: 10, borderRadius: 5 },
  rowBody: { flex: 1 },
  rowStats: { alignItems: 'center', minWidth: 64 },
  empty: { marginTop: Spacing.xxxl },
});
