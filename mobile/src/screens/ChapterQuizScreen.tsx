import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useChapterQuiz, useSubmitChapterQuiz } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { QuestionPrompt } from '@/components/common/QuestionPrompt';
import { QuestionType } from '@/types/course';
import type { Question, ChapterQuizResult } from '@/types/course';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<CoursesStackParamList, 'ChapterQuiz'>;
type RoutePropType = RouteProp<CoursesStackParamList, 'ChapterQuiz'>;

export function ChapterQuizScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { chapterId, chapterName } = useRoute<RoutePropType>().params;

  const { data: quiz, isLoading, error } = useChapterQuiz(chapterId);
  const { mutateAsync: submit, isPending } = useSubmitChapterQuiz(chapterId);

  // questionId → selektierte Antwort-IDs
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ChapterQuizResult | null>(null);

  const toggle = (q: Question, answerId: string) => {
    if (result) return;
    setSelected((prev) => {
      const cur = prev[q.elementId] ?? [];
      if (q.questionType === QuestionType.MultipleChoice) {
        return { ...prev, [q.elementId]: cur.includes(answerId) ? cur.filter((i) => i !== answerId) : [...cur, answerId] };
      }
      return { ...prev, [q.elementId]: [answerId] };
    });
  };

  const onSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.some((q) => (selected[q.elementId] ?? []).length === 0);
    if (unanswered) {
      Alert.alert(t('quiz.selectAnswer'));
      return;
    }
    const answers = quiz.questions.map((q) => {
      const ids = selected[q.elementId] ?? [];
      return q.questionType === QuestionType.MultipleChoice
        ? { questionId: q.elementId, answerIds: ids }
        : { questionId: q.elementId, answerId: ids[0] };
    });
    try {
      setResult(await submit({ answers }));
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const retry = () => {
    setResult(null);
    setSelected({});
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !quiz) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  // Nach Abgabe: revealte Fragen anzeigen, sonst die Eingabe-Fragen.
  const shown = result ? result.questions : quiz.questions;
  const locked = !result && quiz.attemptsExhausted;
  const canRetry =
    !!result && !result.passed && result.attemptsRemaining !== 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {chapterName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {t('chapterQuiz.passThreshold', { percent: quiz.passThresholdPercent })}
          {quiz.maxAttempts > 0
            ? `  ·  ${t('chapterQuiz.attemptsUsed', { used: quiz.attemptsUsed, max: quiz.maxAttempts })}`
            : ''}
        </Text>

        {/* Ergebnis-Banner */}
        {result && (
          <View
            style={[
              styles.banner,
              { backgroundColor: result.passed ? colors.successSurface : colors.errorSurface },
            ]}
          >
            <Text
              style={[styles.bannerTitle, { color: result.passed ? colors.success : colors.error }]}
            >
              {result.passed ? `✅ ${t('chapterQuiz.passed')}` : `❌ ${t('chapterQuiz.failed')}`}
            </Text>
            <Text style={[styles.bannerScore, { color: colors.textPrimary }]}>
              {t('chapterQuiz.scoreOf', {
                correct: result.correctCount,
                total: result.totalCount,
                percent: result.percent,
              })}
            </Text>
          </View>
        )}

        {locked && (
          <View style={[styles.banner, { backgroundColor: colors.errorSurface }]}>
            <Text style={[styles.bannerTitle, { color: colors.error }]}>
              🔒 {t('chapterQuiz.noAttemptsLeft')}
            </Text>
          </View>
        )}

        {shown.map((q) => {
          const sel = selected[q.elementId] ?? [];
          const isTrueFalse = q.questionType === QuestionType.TrueFalse;
          return (
            <View
              key={q.elementId}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            >
              <QuestionPrompt
                text={translate(q.titel)}
                textStyle={[styles.question, { color: colors.textPrimary }]}
                containerStyle={styles.questionPrompt}
              />
              <View style={[styles.answers, isTrueFalse && styles.tfRow]}>
                {q.answers.map((a, idx) => {
                  const isSelected = sel.includes(a.id);
                  // Nach Abgabe sind a.isCorrect/comment aufgedeckt.
                  const showResult = !!result;
                  let borderColor = colors.border;
                  let bg = colors.surface;
                  if (showResult) {
                    if (a.isCorrect) {
                      borderColor = colors.success;
                      bg = colors.successSurface;
                    } else if (isSelected) {
                      borderColor = colors.error;
                      bg = colors.errorSurface;
                    }
                  } else if (isSelected) {
                    borderColor = colors.primary;
                    bg = colors.primarySurface;
                  }
                  return (
                    <View key={a.id} style={isTrueFalse && styles.tfCol}>
                      <TouchableOpacity
                        testID={isTrueFalse ? (idx === 0 ? 'cq-true' : 'cq-false') : undefined}
                        style={[styles.answer, isTrueFalse && styles.tfButton, { borderColor, backgroundColor: bg }]}
                        onPress={() => toggle(q, a.id)}
                        activeOpacity={result ? 1 : 0.7}
                      >
                        <Text style={[styles.answerText, { color: colors.textPrimary }]}>
                          {isTrueFalse ? t(idx === 0 ? 'quiz.true' : 'quiz.false') : translate(a.titel)}
                        </Text>
                        {showResult && a.isCorrect && (
                          <Text style={{ color: colors.success, fontWeight: FontWeight.bold }}>✓</Text>
                        )}
                      </TouchableOpacity>
                      {showResult && a.comment.length > 0 && (
                        <Text style={[styles.comment, { color: colors.textSecondary }]}>{a.comment}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {!result && !locked && (
          <TouchableOpacity
            style={[styles.submit, { backgroundColor: colors.primary }, isPending && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>{t('chapterQuiz.submit')}</Text>
            )}
          </TouchableOpacity>
        )}

        {canRetry && (
          <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary }]} onPress={retry}>
            <Text style={styles.submitText}>{t('chapterQuiz.retry')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { fontSize: FontSize.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  back: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  meta: { fontSize: FontSize.sm },
  banner: { borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  bannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  bannerScore: { fontSize: FontSize.sm },
  card: { borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1.5, ...Shadow.sm },
  question: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  questionPrompt: { marginBottom: Spacing.sm },
  answers: { gap: Spacing.sm },
  tfRow: { flexDirection: 'row', gap: Spacing.md },
  tfCol: { flex: 1 },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  tfButton: { justifyContent: 'center', paddingVertical: Spacing.lg },
  answerText: { fontSize: FontSize.md },
  comment: { fontSize: FontSize.sm, fontStyle: 'italic', paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  submit: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  submitText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
