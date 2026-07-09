import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAdminChallenges, useDeleteChallenge } from '@/hooks/useDailyChallengeAdmin';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import type { ApiDailyChallenge } from '@/types/challenges';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'DailyChallenges'>;

const DIFFICULTY_EMOJI: Record<string, string> = { easy: '🟢', medium: '🟡', hard: '🔴' };

function ChallengeRow({
  challenge,
  onPress,
  onDelete,
  deleting,
}: {
  challenge: ApiDailyChallenge;
  onPress: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: challenge.active ? 1 : 0.5,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {DIFFICULTY_EMOJI[challenge.difficulty] ?? ''} {translate(challenge.title) || challenge.id}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textTertiary }]} numberOfLines={1}>
          {challenge.category} · ~{challenge.estimatedMinutes} min
          {challenge.active ? '' : ' · inaktiv'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        disabled={deleting}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.deleteIcon, { color: deleting ? colors.textTertiary : colors.error }]}>
          🗑
        </Text>
      </TouchableOpacity>
      <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

export function DailyChallengesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { data: challenges, isLoading, error, refetch } = useAdminChallenges();
  const { mutate: remove, isPending: isDeleting } = useDeleteChallenge();

  const onDelete = (c: ApiDailyChallenge) => {
    Alert.alert(
      'Challenge löschen?',
      `„${translate(c.title) || c.id}" wird unwiderruflich gelöscht. Tipp: Deaktivieren statt löschen erhält sie für später.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () =>
            remove(c.id, {
              onError: () => Alert.alert('Fehler', 'Challenge konnte nicht gelöscht werden.'),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>⚡ Daily Challenges</Text>
        <TouchableOpacity
          testID="challenge-new"
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('DailyChallengeEditor', {})}
        >
          <Text style={styles.addButtonText}>+ Neu</Text>
        </TouchableOpacity>
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
          data={challenges ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ChallengeRow
              challenge={item}
              deleting={isDeleting}
              onPress={() => navigation.navigate('DailyChallengeEditor', { challengeId: item.id })}
              onDelete={() => onDelete(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Noch keine Challenges vorhanden.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addButton: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
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
  rowBody: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  rowMeta: { fontSize: FontSize.xs, marginTop: 2 },
  deleteIcon: { fontSize: FontSize.lg },
  arrow: { fontSize: 24 },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
