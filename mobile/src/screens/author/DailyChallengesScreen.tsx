import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
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
import { Badge, Button, Card, Icon, Typography } from '@/components/common';
import { Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'DailyChallenges'>;

const DIFFICULTY_TONE: Record<string, 'success' | 'default' | 'error'> = {
  easy: 'success',
  medium: 'default',
  hard: 'error',
};

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ opacity: challenge.active ? 1 : 0.5 }}>
      <Card style={styles.row}>
        <View style={styles.rowBody}>
          <View style={styles.titleRow}>
            <Badge label={challenge.difficulty} tone={DIFFICULTY_TONE[challenge.difficulty] ?? 'muted'} />
            <Typography variant="label" numberOfLines={1} style={styles.rowTitle}>
              {translate(challenge.title) || challenge.id}
            </Typography>
          </View>
          <Typography variant="caption" color="tertiary" numberOfLines={1}>
            {challenge.category} · ~{challenge.estimatedMinutes} min
            {challenge.active ? '' : ' · inaktiv'}
          </Typography>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          disabled={deleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="delete" size={20} color={deleting ? colors.textTertiary : colors.error} />
        </TouchableOpacity>
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      </Card>
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
        <View style={styles.headerTitle}>
          <Icon name="challenge" size={22} color={colors.accent} />
          <Typography variant="h2">Daily Challenges</Typography>
        </View>
        <Button
          testID="challenge-new"
          title="Neu"
          size="sm"
          iconLeft="add"
          onPress={() => navigation.navigate('DailyChallengeEditor', {})}
        />
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
            <Typography variant="body" color="secondary" center style={styles.empty}>
              Noch keine Challenges vorhanden.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowBody: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowTitle: { flexShrink: 1 },
  empty: { marginTop: Spacing.xxxl },
});
