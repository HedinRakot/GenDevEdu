import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useChapterQuiz, useSubmitChapterQuiz } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import {
  Badge,
  Button,
  Card,
  Icon,
  QuestionPrompt,
  QuizOption,
  Typography,
  type QuizOptionState,
} from '@/components/common';
import { QuestionType } from '@/types/course';
import type { Question, ChapterQuizResult } from '@/types/course';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import { FontFamily, FontSize, Radius, Spacing } from '@/config/theme';

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
        <Icon name="x-circle" size={40} color={colors.error} />
        <Typography variant="body" color="secondary">
          {t('common.error')}
        </Typography>
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
        <Button
          title={t('common.back')}
          variant="ghost"
          size="sm"
          iconLeft="arrow-left"
          onPress={() => navigation.goBack()}
        />
        <Typography variant="h3" numberOfLines={1} style={styles.headerTitle}>
          {chapterName}
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metaRow}>
          <Typography variant="bodySm" color="secondary">
            {t('chapterQuiz.passThreshold', { percent: quiz.passThresholdPercent })}
          </Typography>
          {quiz.maxAttempts > 0 && (
            <Badge
              tone="muted"
              label={t('chapterQuiz.attemptsUsed', { used: quiz.attemptsUsed, max: quiz.maxAttempts })}
            />
          )}
        </View>

        {/* Ergebnis-Banner */}
        {result && (
          <View
            style={[
              styles.banner,
              { backgroundColor: result.passed ? colors.successSurface : colors.errorSurface },
            ]}
          >
            <Icon
              name={result.passed ? 'check-circle' : 'x-circle'}
              size={22}
              color={result.passed ? colors.success : colors.error}
            />
            <View style={styles.bannerBody}>
              <Typography variant="label" color={result.passed ? colors.success : colors.error}>
                {result.passed ? t('chapterQuiz.passed') : t('chapterQuiz.failed')}
              </Typography>
              <Typography variant="bodySm" color="primary">
                {t('chapterQuiz.scoreOf', {
                  correct: result.correctCount,
                  total: result.totalCount,
                  percent: result.percent,
                })}
              </Typography>
            </View>
          </View>
        )}

        {locked && (
          <View style={[styles.banner, { backgroundColor: colors.errorSurface }]}>
            <Icon name="lock" size={20} color={colors.error} />
            <Typography variant="label" color={colors.error}>
              {t('chapterQuiz.noAttemptsLeft')}
            </Typography>
          </View>
        )}

        {shown.map((q) => {
          const sel = selected[q.elementId] ?? [];
          const isTrueFalse = q.questionType === QuestionType.TrueFalse;
          return (
            <Card key={q.elementId}>
              <QuestionPrompt
                text={translate(q.titel)}
                textStyle={[styles.question, { color: colors.textPrimary }]}
                containerStyle={styles.questionPrompt}
              />
              <View style={styles.answers}>
                {q.answers.map((a, idx) => {
                  const isSelected = sel.includes(a.id);
                  // Nach Abgabe sind a.isCorrect/comment aufgedeckt.
                  const showResult = !!result;
                  let state: QuizOptionState = 'default';
                  if (showResult) {
                    if (a.isCorrect) state = 'correct';
                    else if (isSelected) state = 'incorrect';
                  } else if (isSelected) {
                    state = 'selected';
                  }
                  const label = isTrueFalse
                    ? t(idx === 0 ? 'quiz.true' : 'quiz.false')
                    : translate(a.titel);
                  return (
                    <View key={a.id} testID={isTrueFalse ? (idx === 0 ? 'cq-true' : 'cq-false') : undefined}>
                      <QuizOption
                        letter={String.fromCharCode(65 + idx)}
                        label={label}
                        state={state}
                        disabled={!!result}
                        onPress={() => toggle(q, a.id)}
                      />
                      {showResult && a.comment.length > 0 && (
                        <Typography variant="bodySm" color="secondary" style={styles.comment}>
                          {a.comment}
                        </Typography>
                      )}
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}

        {!result && !locked && (
          <Button
            title={t('chapterQuiz.submit')}
            variant="primary"
            fullWidth
            loading={isPending}
            iconRight="arrow-right"
            onPress={onSubmit}
          />
        )}

        {canRetry && (
          <Button
            title={t('chapterQuiz.retry')}
            variant="primary"
            fullWidth
            iconRight="arrow-right"
            onPress={retry}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  headerTitle: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bannerBody: { flex: 1, gap: 2 },
  question: { fontFamily: FontFamily.serifSemibold, fontSize: FontSize.lg, marginBottom: Spacing.md },
  questionPrompt: { marginBottom: Spacing.sm },
  answers: { gap: Spacing.sm },
  comment: {
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
});
