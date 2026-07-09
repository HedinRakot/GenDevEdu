import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { useLearnerStats } from '@/hooks/useAdminStats';
import { useTheme } from '@/context/ThemeContext';
import type { LearnersStackParamList } from '@/navigation/LearnersStack';
import { Card, Icon, type IconName, Typography } from '@/components/common';
import { Spacing } from '@/config/theme';

type RoutePropType = RouteProp<LearnersStackParamList, 'LearnerStats'>;

/** Ab weniger als so vielen erfassten Minuten gilt ein abgeschlossenes Kapitel als "nur abgehakt". */
const LOW_ENGAGEMENT_MINUTES = 5;

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? <Icon name={icon} size={18} color={colors.accent} /> : null}
        <Typography variant="h3" numberOfLines={1} style={styles.sectionTitle}>
          {title}
        </Typography>
      </View>
      {children}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Typography variant="h3">{value}</Typography>
      <Typography variant="caption" color="tertiary">{label}</Typography>
    </View>
  );
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

/** Teilnehmer-Detail: Statistiken, Lernzeiten, Engagement, Antworten (AuthorOrAdmin). */
export function LearnerStatsScreen() {
  const { colors } = useTheme();
  const route = useRoute<RoutePropType>();
  const { userId } = route.params;
  const { data, isLoading, error } = useLearnerStats(userId);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Typography variant="body" color={colors.error}>Fehler beim Laden</Typography>
      </View>
    );
  }

  const s = data.stats;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Kopf */}
        <Section title={data.displayName} icon="users">
          <Typography variant="bodySm" color="secondary">{data.email}</Typography>
          <View style={styles.statRow}>
            <Stat label="Lernzeit gesamt" value={`${Math.round(data.totalLearningMinutes / 60)}h ${data.totalLearningMinutes % 60}m`} />
            <Stat label="Zuletzt aktiv" value={formatDate(data.lastActivityUtc)} />
          </View>
        </Section>

        {/* Statistiken */}
        <Section title="Statistiken" icon="dashboard">
          <View style={styles.statRow}>
            <Stat label="Aktive Kurse" value={s.activeCourses} />
            <Stat label="Abgeschlossen" value={s.completedCourses} />
            <Stat label="Fortschritt" value={`${s.overallProgressPercent}%`} />
          </View>
          <View style={styles.statRow}>
            <Stat label="Fragen richtig" value={`${s.correctAnswered}/${s.totalAnswered}`} />
            <Stat label="Quiz-Quote" value={`${s.quizAccuracyPercent}%`} />
            <Stat label="Code gelöst" value={`${s.codeTasksSolved}/${s.codeTasksAttempted}`} />
          </View>
        </Section>

        {/* Kurse */}
        {s.courses.length > 0 && (
          <Section title="Kurse" icon="courses">
            {s.courses.map((c) => (
              <View key={c.courseId} style={styles.line}>
                <View style={styles.lineLabel}>
                  <Icon
                    name={c.completed ? 'check-circle' : 'courses'}
                    size={16}
                    color={c.completed ? colors.success : colors.textTertiary}
                  />
                  <Typography variant="bodySm" numberOfLines={1} style={styles.lineTitle}>
                    {c.courseName}
                  </Typography>
                </View>
                <Typography variant="caption" color="secondary" style={styles.lineValue}>
                  {c.progressPercent}% · {c.completedContent}/{c.totalContent} Inhalte
                </Typography>
              </View>
            ))}
          </Section>
        )}

        {/* Lernzeit je Kurs/Kapitel */}
        {data.courseTimes.length > 0 && (
          <Section title="Lernzeit (aus Aktivitäts-Heartbeats)" icon="clock">
            {data.courseTimes.map((ct) => (
              <View key={ct.courseId} style={styles.block}>
                <View style={styles.line}>
                  <Typography variant="bodySm" numberOfLines={1} style={styles.lineTitle}>
                    {ct.courseName}
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.lineValue}>
                    ~{ct.minutes} min
                  </Typography>
                </View>
                {ct.chapters.map((ch) => (
                  <View key={ch.chapterId} style={[styles.line, styles.subLine]}>
                    <Typography variant="caption" color="secondary" numberOfLines={1} style={styles.lineTitle}>
                      {ch.chapterName}
                    </Typography>
                    <Typography variant="caption" color="tertiary" style={styles.lineValue}>
                      ~{ch.minutes} min
                    </Typography>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Engagement */}
        {data.engagement.length > 0 && (
          <Section title="Bearbeitung je Kapitel" icon="search">
            <View style={styles.hintRow}>
              <Icon name="clock" size={14} color={colors.warning} />
              <Typography variant="caption" color="tertiary" style={styles.hint}>
                abgeschlossen, aber weniger als {LOW_ENGAGEMENT_MINUTES} min erfasste Aktivität
                („nur abgehakt?")
              </Typography>
            </View>
            {data.engagement.map((e) => {
              const suspicious =
                e.completedContentCount > 0 && e.minutesTracked < LOW_ENGAGEMENT_MINUTES;
              return (
                <View key={`${e.courseId}-${e.chapterId}`} style={styles.line}>
                  <View style={styles.lineLabel}>
                    {suspicious ? <Icon name="clock" size={16} color={colors.warning} /> : null}
                    <Typography variant="bodySm" numberOfLines={1} style={styles.lineTitle}>
                      {e.chapterName}
                    </Typography>
                  </View>
                  <Typography variant="caption" color="secondary" style={styles.lineValue}>
                    {e.completedContentCount}/{e.totalContentCount}
                    {e.quizPassed ? ' · Quiz bestanden' : ''} · ~{e.minutesTracked} min
                  </Typography>
                </View>
              );
            })}
          </Section>
        )}

        {/* Fragen-Historie */}
        {data.recentAttempts.length > 0 && (
          <Section title={`Letzte Antworten (${data.recentAttempts.length})`} icon="message">
            {data.recentAttempts.map((a, i) => (
              <View key={`${a.questionId}-${a.createdAt}-${i}`} style={styles.attempt}>
                <View style={styles.lineLabel}>
                  <Icon
                    name={a.isCorrect ? 'check-circle' : 'x-circle'}
                    size={16}
                    color={a.isCorrect ? colors.success : colors.error}
                  />
                  <Typography variant="bodySm" numberOfLines={2} style={styles.lineTitle}>
                    {a.questionText ?? '(Frage wurde entfernt)'}
                  </Typography>
                </View>
                {a.selectedAnswers.length > 0 && (
                  <Typography variant="caption" color="secondary" numberOfLines={2}>
                    Antwort: {a.selectedAnswers.join(', ')}
                  </Typography>
                )}
                {!!a.submittedText && (
                  <Typography variant="caption" color="secondary" numberOfLines={2}>
                    Text: {a.submittedText}
                  </Typography>
                )}
                <Typography variant="caption" color="tertiary">
                  {formatDate(a.createdAt)}
                </Typography>
              </View>
            ))}
          </Section>
        )}

        {/* Code-Abgaben */}
        {data.recentCodeSubmissions.length > 0 && (
          <Section title={`Code-Abgaben (${data.recentCodeSubmissions.length})`} icon="snippets">
            {data.recentCodeSubmissions.map((c, i) => (
              <View key={`${c.questionId}-${c.createdAt}-${i}`} style={styles.line}>
                <View style={styles.lineLabel}>
                  <Icon
                    name={c.outcome === 'Passed' ? 'check-circle' : 'x-circle'}
                    size={16}
                    color={c.outcome === 'Passed' ? colors.success : colors.error}
                  />
                  <Typography variant="bodySm" style={styles.lineTitle}>{c.outcome}</Typography>
                </View>
                <Typography variant="caption" color="secondary" style={styles.lineValue}>
                  {c.passedCount}/{c.totalCount} Tests · {formatDate(c.createdAt)}
                </Typography>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  sectionTitle: { flexShrink: 1 },
  statRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 90, gap: 2 },
  block: { gap: 2 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  lineLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 1 },
  subLine: { paddingLeft: Spacing.lg, paddingVertical: 2 },
  lineTitle: { flexShrink: 1 },
  lineValue: { textAlign: 'right' },
  attempt: { paddingVertical: Spacing.xs, gap: 2 },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginBottom: Spacing.xs },
  hint: { flexShrink: 1, fontStyle: 'italic' },
});
