import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { Badge, Button, Card, Icon, MarkdownRenderer, Typography } from '@/components/common';
import { FontSize, Radius, Spacing } from '@/config/theme';

interface Props {
  /** Wird aufgerufen, nachdem die Challenge abgeschlossen wurde (für UI-Updates). */
  onCompleted?: () => void;
}

const DIFFICULTY_TONE = {
  easy: 'success',
  medium: 'default',
  hard: 'error',
} as const;

export function DailyChallengeCard({ onCompleted }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { challenge, isDone, isLoading, complete } = useDailyChallenge();
  const [open, setOpen] = useState(false);

  const title = translate(challenge.title);
  const description = translate(challenge.description);

  const onComplete = async () => {
    await complete();
    onCompleted?.();
    setOpen(false);
  };

  return (
    <>
      <Card>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSurface }]}>
            <Icon name="challenge" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" color="tertiary" style={styles.label}>
              {t('dashboard.challenge.label')}
            </Typography>
            <Typography variant="h3" numberOfLines={1}>
              {title}
            </Typography>
          </View>
          {isDone ? (
            <Badge label={t('dashboard.challenge.done')} tone="success" />
          ) : (
            <View style={styles.badgeRow}>
              <Badge
                label={t(`dashboard.challenge.difficulty.${challenge.difficulty}`)}
                tone={DIFFICULTY_TONE[challenge.difficulty]}
              />
              <Badge label={`${challenge.estimatedMinutes} min`} tone="accent" />
            </View>
          )}
        </View>
        <Typography variant="bodySm" color="secondary" numberOfLines={2} style={styles.description}>
          {description}
        </Typography>
        <Button
          title={isDone ? t('dashboard.challenge.review') : t('dashboard.challenge.start')}
          variant={isDone ? 'secondary' : 'primary'}
          onPress={() => setOpen(true)}
          disabled={isLoading}
        />
      </Card>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Typography variant="h2" style={{ flex: 1 }}>
                {title}
              </Typography>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Icon name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
              <Typography variant="body" color="secondary">
                {description}
              </Typography>
              {challenge.exampleSnippet && (
                <View style={{ marginTop: Spacing.md }}>
                  <Typography variant="label" color="tertiary" style={styles.snippetLabel}>
                    {t('dashboard.challenge.hint')}
                  </Typography>
                  <MarkdownRenderer
                    content={
                      '```' +
                      (challenge.snippetLang ?? 'csharp') +
                      '\n' +
                      challenge.exampleSnippet +
                      '\n```'
                    }
                  />
                </View>
              )}
            </ScrollView>
            <Button
              title={isDone ? t('dashboard.challenge.alreadyDone') : t('dashboard.challenge.markDone')}
              variant={isDone ? 'secondary' : 'primary'}
              fullWidth
              onPress={onComplete}
              disabled={isDone}
              style={isDone ? undefined : { backgroundColor: colors.success }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  description: { lineHeight: 20, marginBottom: Spacing.md },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    minHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  snippetLabel: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
});
