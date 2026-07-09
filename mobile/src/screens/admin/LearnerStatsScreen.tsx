import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { useLearnerStats } from '@/hooks/useAdminStats';
import { useTheme } from '@/context/ThemeContext';
import type { LearnersStackParamList } from '@/navigation/LearnersStack';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

type RoutePropType = RouteProp<LearnersStackParamList, 'LearnerStats'>;

/** Ab weniger als so vielen erfassten Minuten gilt ein abgeschlossenes Kapitel als "nur abgehakt". */
const LOW_ENGAGEMENT_MINUTES = 5;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
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
        <Text style={{ color: colors.error }}>Fehler beim Laden</Text>
      </View>
    );
  }

  const s = data.stats;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Kopf */}
        <Section title={data.displayName}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{data.email}</Text>
          <View style={styles.statRow}>
            <Stat label="Lernzeit gesamt" value={`${Math.round(data.totalLearningMinutes / 60)}h ${data.totalLearningMinutes % 60}m`} />
            <Stat label="Zuletzt aktiv" value={formatDate(data.lastActivityUtc)} />
          </View>
        </Section>

        {/* Statistiken */}
        <Section title="📊 Statistiken">
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
          <Section title="📚 Kurse">
            {s.courses.map((c) => (
              <View key={c.courseId} style={styles.line}>
                <Text style={[styles.lineTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {c.completed ? '✅' : '📖'} {c.courseName}
                </Text>
                <Text style={[styles.lineValue, { color: colors.textSecondary }]}>
                  {c.progressPercent}% · {c.completedContent}/{c.totalContent} Inhalte
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* Lernzeit je Kurs/Kapitel */}
        {data.courseTimes.length > 0 && (
          <Section title="⏱️ Lernzeit (aus Aktivitäts-Heartbeats)">
            {data.courseTimes.map((ct) => (
              <View key={ct.courseId} style={styles.block}>
                <View style={styles.line}>
                  <Text style={[styles.lineTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {ct.courseName}
                  </Text>
                  <Text style={[styles.lineValue, { color: colors.textSecondary }]}>
                    ~{ct.minutes} min
                  </Text>
                </View>
                {ct.chapters.map((ch) => (
                  <View key={ch.chapterId} style={[styles.line, styles.subLine]}>
                    <Text style={[styles.subTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {ch.chapterName}
                    </Text>
                    <Text style={[styles.lineValue, { color: colors.textTertiary }]}>
                      ~{ch.minutes} min
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Engagement */}
        {data.engagement.length > 0 && (
          <Section title="🔎 Bearbeitung je Kapitel">
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              ⚠️ = abgeschlossen, aber weniger als {LOW_ENGAGEMENT_MINUTES} min erfasste Aktivität
              („nur abgehakt?")
            </Text>
            {data.engagement.map((e) => {
              const suspicious =
                e.completedContentCount > 0 && e.minutesTracked < LOW_ENGAGEMENT_MINUTES;
              return (
                <View key={`${e.courseId}-${e.chapterId}`} style={styles.line}>
                  <Text style={[styles.lineTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {suspicious ? '⚠️ ' : ''}
                    {e.chapterName}
                  </Text>
                  <Text style={[styles.lineValue, { color: colors.textSecondary }]}>
                    {e.completedContentCount}/{e.totalContentCount}
                    {e.quizPassed ? ' · Quiz ✓' : ''} · ~{e.minutesTracked} min
                  </Text>
                </View>
              );
            })}
          </Section>
        )}

        {/* Fragen-Historie */}
        {data.recentAttempts.length > 0 && (
          <Section title={`❓ Letzte Antworten (${data.recentAttempts.length})`}>
            {data.recentAttempts.map((a, i) => (
              <View key={`${a.questionId}-${a.createdAt}-${i}`} style={styles.attempt}>
                <Text style={[styles.lineTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {a.isCorrect ? '✅' : '❌'} {a.questionText ?? '(Frage wurde entfernt)'}
                </Text>
                {a.selectedAnswers.length > 0 && (
                  <Text style={[styles.subTitle, { color: colors.textSecondary }]} numberOfLines={2}>
                    Antwort: {a.selectedAnswers.join(', ')}
                  </Text>
                )}
                {!!a.submittedText && (
                  <Text style={[styles.subTitle, { color: colors.textSecondary }]} numberOfLines={2}>
                    Text: {a.submittedText}
                  </Text>
                )}
                <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                  {formatDate(a.createdAt)}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {/* Code-Abgaben */}
        {data.recentCodeSubmissions.length > 0 && (
          <Section title={`💻 Code-Abgaben (${data.recentCodeSubmissions.length})`}>
            {data.recentCodeSubmissions.map((c, i) => (
              <View key={`${c.questionId}-${c.createdAt}-${i}`} style={styles.line}>
                <Text style={[styles.lineTitle, { color: colors.textPrimary }]}>
                  {c.outcome === 'Passed' ? '✅' : '❌'} {c.outcome}
                </Text>
                <Text style={[styles.lineValue, { color: colors.textSecondary }]}>
                  {c.passedCount}/{c.totalCount} Tests · {formatDate(c.createdAt)}
                </Text>
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
  section: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  meta: { fontSize: FontSize.sm },
  statRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: 90 },
  statValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  block: { gap: 2 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  subLine: { paddingLeft: Spacing.lg, paddingVertical: 2 },
  lineTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flexShrink: 1 },
  subTitle: { fontSize: FontSize.xs, flexShrink: 1 },
  lineValue: { fontSize: FontSize.xs, textAlign: 'right' },
  attempt: { paddingVertical: Spacing.xs, gap: 2 },
  timestamp: { fontSize: FontSize.xs },
  hint: { fontSize: FontSize.xs, fontStyle: 'italic', marginBottom: Spacing.xs },
});
