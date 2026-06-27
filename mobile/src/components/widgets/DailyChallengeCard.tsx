import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { Card } from '@/components/common/Card';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

interface Props {
  /** Wird aufgerufen, nachdem die Challenge abgeschlossen wurde (für UI-Updates). */
  onCompleted?: () => void;
}

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
          <Text style={styles.emoji}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>
              {t('dashboard.challenge.label')}
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {isDone ? (
            <View style={[styles.badge, { backgroundColor: colors.successSurface }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>
                ✓ {t('dashboard.challenge.done')}
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.accentSurface }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>
                {challenge.estimatedMinutes} min
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {description}
        </Text>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: isDone ? colors.surfaceElevated : colors.primary }]}
          onPress={() => setOpen(true)}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.ctaText,
              { color: isDone ? colors.textSecondary : colors.textInverted },
            ]}
          >
            {isDone ? t('dashboard.challenge.review') : t('dashboard.challenge.start')}
          </Text>
        </TouchableOpacity>
      </Card>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{title}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={[styles.close, { color: colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{description}</Text>
              {challenge.exampleSnippet && (
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={[styles.snippetLabel, { color: colors.textTertiary }]}>
                    {t('dashboard.challenge.hint')}
                  </Text>
                  <MarkdownRenderer
                    content={'```js\n' + challenge.exampleSnippet + '\n```'}
                  />
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.completeBtn,
                { backgroundColor: isDone ? colors.surfaceElevated : colors.success },
              ]}
              onPress={onComplete}
              disabled={isDone}
            >
              <Text
                style={[
                  styles.completeBtnText,
                  { color: isDone ? colors.textSecondary : colors.textInverted },
                ]}
              >
                {isDone ? t('dashboard.challenge.alreadyDone') : t('dashboard.challenge.markDone')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  emoji: { fontSize: 28 },
  label: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  description: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.md },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  ctaText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { padding: Spacing.lg, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, minHeight: '70%' },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, flex: 1 },
  close: { fontSize: 24 },
  body: { fontSize: FontSize.md, lineHeight: 22 },
  snippetLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  completeBtn: { padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  completeBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
