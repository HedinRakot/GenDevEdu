import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import {
  useChapterContent,
  useCompleteContent,
  useQuestions,
  useSubmitAttempt,
  useSubmitCode,
  usePollCodeSubmission,
} from '@/hooks/useCourses';
import { useSnippets } from '@/hooks/useSnippets';
import { useStreak } from '@/hooks/useStreak';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { htmlToMarkdown } from '@/utils/htmlToMarkdown';
import { ChapterContentType, QuestionType } from '@/types/course';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import type { ChapterContent as ChapterContentModel, Question } from '@/types/course';
import { markLessonComplete } from '@/store/storage';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { QuestionPrompt } from '@/components/common/QuestionPrompt';
import { Button, Icon, Typography } from '@/components/common';
import { FontFamily, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<CoursesStackParamList, 'Lesson'>;
type RoutePropType = RouteProp<CoursesStackParamList, 'Lesson'>;

type AnswerStatus = 'idle' | 'correct' | 'incorrect';

// ─── QuestionCard (Dispatcher) ──────────────────────────────────────────────

type QuestionCardProps = { question: Question; onAnsweredCorrectly: () => void };

export function QuestionCard(props: QuestionCardProps) {
  // Code-Aufgaben werden asynchron ausgewertet (Submit → Polling) und haben eine
  // eigene UI; Choice/Wahr-Falsch teilen sich die synchrone Auswertung.
  if (props.question.questionType === QuestionType.Code) {
    return <CodeQuestionCard {...props} />;
  }
  return <ChoiceQuestionCard {...props} />;
}

// ─── ChoiceQuestionCard (OneChoice / MultipleChoice / TrueFalse) ─────────────

function ChoiceQuestionCard({ question, onAnsweredCorrectly }: QuestionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mutateAsync, isPending } = useSubmitAttempt();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<AnswerStatus>('idle');
  // Server-revealed answers (id → correctness + explanation), populated after grading.
  const [revealed, setRevealed] = useState<Map<string, { isCorrect: boolean; comment: string }>>(
    new Map(),
  );

  const isMulti = question.questionType === QuestionType.MultipleChoice;
  // TrueFalse is single-select (like OneChoice) but rendered as two side-by-side buttons.
  const isTrueFalse = question.questionType === QuestionType.TrueFalse;

  const toggleSelect = (id: string) => {
    if (status !== 'idle') return;
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      );
    } else {
      setSelectedIds([id]);
    }
  };

  // Server-side grading: the GET endpoint hides isCorrect from learners, so the
  // attempt endpoint is the source of truth (and records the attempt in Mongo).
  const validate = async () => {
    if (selectedIds.length === 0) {
      Alert.alert(t('quiz.selectAnswer'));
      return;
    }
    try {
      const req = isMulti ? { answerIds: selectedIds } : { answerId: selectedIds[0] };
      const result = await mutateAsync({ questionId: question.elementId, req });
      setRevealed(
        new Map(result.answers.map((a) => [a.id, { isCorrect: a.isCorrect, comment: a.comment }])),
      );
      setStatus(result.isCorrect ? 'correct' : 'incorrect');
      if (result.isCorrect) onAnsweredCorrectly();
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const reset = () => {
    setStatus('idle');
    setSelectedIds([]);
    setRevealed(new Map());
  };

  return (
    <View
      style={[
        styles.questionCard,
        {
          backgroundColor: colors.surface,
          borderColor:
            status === 'correct'
              ? colors.success
              : status === 'incorrect'
                ? colors.error
                : colors.borderLight,
        },
      ]}
    >
      <QuestionPrompt
        text={translate(question.titel)}
        textStyle={[styles.questionTitle, { color: colors.textPrimary }]}
        containerStyle={styles.questionPrompt}
      />
      <View style={[styles.answerList, isTrueFalse && styles.trueFalseRow]}>
        {question.answers.map((answer, idx) => {
          const isSelected = selectedIds.includes(answer.id);
          const showCorrectness = status !== 'idle';
          const isCorrectAnswer = revealed.get(answer.id)?.isCorrect ?? false;
          const comment = revealed.get(answer.id)?.comment ?? '';

          let borderColor = colors.border;
          let bg = colors.surface;

          if (showCorrectness) {
            if (isCorrectAnswer) {
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
            <View key={answer.id} style={isTrueFalse && styles.trueFalseCol}>
              <TouchableOpacity
                testID={isTrueFalse ? (idx === 0 ? 'truefalse-true' : 'truefalse-false') : undefined}
                style={[
                  styles.answerRow,
                  isTrueFalse && styles.trueFalseButton,
                  { borderColor, backgroundColor: bg },
                ]}
                onPress={() => toggleSelect(answer.id)}
                activeOpacity={status === 'idle' ? 0.7 : 1}
              >
                {!isTrueFalse && (
                  <View
                    style={[
                      styles.radio,
                      { borderColor: isSelected ? colors.primary : colors.border },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                )}
                <Typography
                  color={colors.textPrimary}
                  style={[
                    styles.answerText,
                    isTrueFalse && styles.trueFalseText,
                    isSelected && { fontFamily: FontFamily.sansSemibold },
                  ]}
                >
                  {translate(answer.titel)}
                </Typography>
                {showCorrectness && isCorrectAnswer && (
                  <Icon name="check" size={18} color={colors.success} strokeWidth={2.5} />
                )}
                {showCorrectness && !isCorrectAnswer && isSelected && (
                  <Icon name="close" size={18} color={colors.error} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
              {showCorrectness && comment.length > 0 && (
                <Typography variant="bodySm" color={colors.textSecondary} style={styles.explanation}>
                  {comment}
                </Typography>
              )}
            </View>
          );
        })}
      </View>

      {status === 'idle' ? (
        <Button
          testID="submit-answer"
          title={t('quiz.check')}
          variant="primary"
          fullWidth
          loading={isPending}
          disabled={isPending}
          onPress={validate}
        />
      ) : (
        <View style={styles.feedback}>
          <View style={styles.feedbackTextRow}>
            <Icon
              name={status === 'correct' ? 'check-circle' : 'x-circle'}
              size={18}
              color={status === 'correct' ? colors.success : colors.error}
            />
            <Typography
              testID="answer-feedback"
              variant="label"
              color={status === 'correct' ? colors.success : colors.error}
            >
              {status === 'correct' ? t('quiz.correct') : t('quiz.tryAgain')}
            </Typography>
          </View>
          {status === 'incorrect' && (
            <View style={styles.feedbackActions}>
              <Button title={t('common.retry')} variant="ghost" size="sm" onPress={reset} />
              <Button
                testID="quiz-why-wrong"
                title={t('chat.whyWrong')}
                variant="ghost"
                size="sm"
                iconLeft="chat"
                onPress={() =>
                  navigation.navigate('Chat' as never, {
                    context: {
                      courseId: route.params?.courseId,
                      chapterId: route.params?.chapterId,
                      questionId: question.elementId,
                      selectedAnswer: question.answers
                        .filter((a) => selectedIds.includes(a.id))
                        .map((a) => translate(a.titel))
                        .join(', '),
                    },
                    seed: t('chat.explainWrong'),
                    seedNonce: Date.now(),
                  } as never)
                }
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── CodeQuestionCard (F7) ───────────────────────────────────────────────────

function CodeQuestionCard({ question, onAnsweredCorrectly }: QuestionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mutateAsync, isPending } = useSubmitCode();
  const [code, setCode] = useState(question.code?.starterCode ?? '');
  const [submissionId, setSubmissionId] = useState<string | undefined>(undefined);
  const answered = useRef(false);

  const { data: result } = usePollCodeSubmission(submissionId);
  const polling =
    !!submissionId && (!result || result.status === 'Queued' || result.status === 'Running');
  const passed = result?.status === 'Completed' && result.outcome === 'Passed';

  useEffect(() => {
    if (passed && !answered.current) {
      answered.current = true;
      onAnsweredCorrectly();
    }
  }, [passed, onAnsweredCorrectly]);

  const onSubmit = async () => {
    answered.current = false;
    try {
      const res = await mutateAsync({ questionId: question.elementId, code });
      setSubmissionId(res.id);
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  const borderColor =
    result?.status === 'Completed'
      ? passed
        ? colors.success
        : colors.error
      : colors.borderLight;

  return (
    <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor }]}>
      <QuestionPrompt
        text={translate(question.titel)}
        textStyle={[styles.questionTitle, { color: colors.textPrimary }]}
        containerStyle={styles.questionPrompt}
      />

      <TextInput
        style={[
          styles.codeInput,
          { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
        ]}
        value={code}
        onChangeText={setCode}
        editable={!polling}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder={t('quiz.code.placeholder')}
        placeholderTextColor={colors.textTertiary}
      />

      <Button
        title={polling ? t('quiz.code.grading') : t('quiz.code.submit')}
        variant="primary"
        fullWidth
        loading={polling}
        disabled={polling || isPending}
        onPress={onSubmit}
      />

      <View style={styles.codeHelpButton}>
        <Button
          testID="code-ask-tutor"
          title={t('quiz.code.askTutor')}
          variant="ghost"
          size="sm"
          iconLeft="chat"
          onPress={() =>
            navigation.navigate('Chat' as never, {
              context: {
                courseId: route.params?.courseId,
                chapterId: route.params?.chapterId,
                questionId: question.elementId,
              },
            } as never)
          }
        />
      </View>

      {result?.status === 'Error' && (
        <View style={{ marginTop: Spacing.md }}>
          <View style={styles.feedbackTextRow}>
            <Icon name="x-circle" size={18} color={colors.error} />
            <Typography variant="label" color={colors.error}>
              {t('quiz.code.error')}
            </Typography>
          </View>
          {result.errorMessage ? (
            <Typography variant="bodySm" color={colors.textSecondary} style={styles.codeSummary}>
              {result.errorMessage}
            </Typography>
          ) : null}
        </View>
      )}

      {result?.status === 'Completed' && (
        <View style={styles.codeResult}>
          <View style={styles.feedbackTextRow}>
            <Icon
              name={passed ? 'check-circle' : 'x-circle'}
              size={18}
              color={passed ? colors.success : colors.error}
            />
            <Typography variant="label" color={passed ? colors.success : colors.error}>
              {passed ? t('quiz.code.allTestsPassed') : t('quiz.code.testsFailed')}
            </Typography>
          </View>
          <Typography variant="bodySm" color={colors.textSecondary} style={styles.codeSummary}>
            {t('quiz.code.passedOf', { passed: result.passedCount, total: result.totalCount })}
            {`  ·  ${result.durationMs} ms`}
          </Typography>

          {result.compileError ? (
            <>
              <Typography variant="label" color={colors.error} style={styles.label}>
                {t('quiz.code.compileError')}
              </Typography>
              <Typography
                variant="code"
                color={colors.textPrimary}
                style={[styles.codeOutput, { backgroundColor: colors.background }]}
              >
                {result.compileError}
              </Typography>
            </>
          ) : (
            result.testResults.map((tr, i) => (
              <View key={tr.testCaseId} style={styles.testRow}>
                <View style={styles.testLineRow}>
                  <Icon
                    name={tr.passed ? 'check' : 'close'}
                    size={16}
                    color={tr.passed ? colors.success : colors.error}
                    strokeWidth={2.5}
                  />
                  <Typography
                    variant="label"
                    color={tr.passed ? colors.success : colors.error}
                    style={styles.testLine}
                  >
                    {t('quiz.code.testN', { n: i + 1 })}
                    {tr.hidden ? ` (${t('quiz.code.hidden')})` : ''}
                    {tr.passed ? '' : ` — ${tr.outcome}`}
                  </Typography>
                </View>
                {!tr.hidden && !tr.passed && (
                  <Typography
                    variant="code"
                    color={colors.textSecondary}
                    style={[styles.codeOutput, { backgroundColor: colors.background }]}
                  >
                    {t('quiz.code.expected')}: {tr.expectedOutput ?? ''}
                    {'\n'}
                    {t('quiz.code.actual')}: {tr.actualOutput ?? ''}
                    {tr.stderr ? `\n${tr.stderr}` : ''}
                  </Typography>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── QuestionsSection — lädt Fragen per questionListId lazy ──────────────────

function QuestionsSection({
  questionListId,
  onAllAnswered,
}: {
  questionListId: string;
  onAllAnswered: () => void;
}) {
  const { colors } = useTheme();
  const { data, isLoading } = useQuestions(questionListId);
  const [solved, setSolved] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <View style={styles.questionLoading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const questions = data?.questions ?? [];

  const onCorrect = (qid: string) => {
    setSolved((prev) => {
      const next = new Set(prev);
      next.add(qid);
      if (next.size === questions.length && questions.length > 0) {
        onAllAnswered();
      }
      return next;
    });
  };

  return (
    <>
      {questions.map((q) => (
        <QuestionCard
          key={q.elementId}
          question={q}
          onAnsweredCorrectly={() => onCorrect(q.elementId)}
        />
      ))}
    </>
  );
}

// ─── ContentItem ──────────────────────────────────────────────────────────────

function ContentItem({
  content,
  onCompleted,
}: {
  content: ChapterContentModel;
  onCompleted: (contentId: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { save: saveSnippet, isFavorited } = useSnippets();
  const title = translate(content.titel);

  if (content.contentType === ChapterContentType.Lesson) {
    // Kursinhalt ist HTML (Legacy-Editor) → in Markdown wandeln, damit Tags wie
    // <ul>/<li> formatiert dargestellt werden statt als roher Text zu erscheinen.
    const text = htmlToMarkdown(translate(content.lessonTexte) || content.lessonText);
    const favorited = isFavorited(content.elementId);

    return (
      <View style={styles.contentSection}>
        <View style={styles.lessonHeader}>
          <View style={styles.lessonTitleBlock}>
            <Typography variant="caption" color="accent" style={styles.eyebrow}>
              {t('snippets.lesson')}
            </Typography>
            <Typography variant="h2" color={colors.textPrimary}>
              {title}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => {
              saveSnippet({
                title,
                content: text,
                source: 'lesson',
                refId: content.elementId,
                tags: ['lesson'],
              });
              Alert.alert(t('snippets.saved'));
            }}
            disabled={favorited}
          >
            <Icon name="snippets" size={24} color={favorited ? colors.accent : colors.textTertiary} />
          </TouchableOpacity>
        </View>
        <MarkdownRenderer content={text} />
        <Button
          title={t('quiz.markLessonComplete')}
          variant="primary"
          fullWidth
          iconRight="arrow-right"
          onPress={() => onCompleted(content.elementId)}
          style={styles.completeButton}
        />
      </View>
    );
  }

  if (content.contentType === ChapterContentType.Video) {
    return (
      <View style={styles.contentSection}>
        <Text style={[styles.h1, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.videoPlaceholder}>
          <Icon name="play" size={18} color="white" />
          <Text style={styles.videoPlaceholderText}>Video: {content.videoUrl || 'URL'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.primary }]}
          onPress={() => onCompleted(content.elementId)}
        >
          <Text style={styles.completeButtonText}>{t('quiz.markLessonComplete')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (content.contentType === ChapterContentType.Questions) {
    return (
      <View style={styles.contentSection}>
        <Text style={[styles.h1, { color: colors.textPrimary }]}>{title}</Text>
        {content.questionListId ? (
          <QuestionsSection
            questionListId={content.questionListId}
            onAllAnswered={() => onCompleted(content.elementId)}
          />
        ) : (
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Keine Fragen verfügbar.
          </Text>
        )}
      </View>
    );
  }

  return null;
}

// ─── LessonScreen ─────────────────────────────────────────────────────────────

export function LessonScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const { chapterId, courseId } = route.params;

  const { data: model, isLoading, error } = useChapterContent(chapterId);
  const { recordActivity } = useStreak();
  const { mutate: markComplete } = useCompleteContent();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const chapterCompleteShown = useRef(false);

  const handleContentCompleted = useCallback(
    (contentId: string) => {
      setCompletedIds((prev) => {
        if (prev.has(contentId)) return prev;
        const next = new Set(prev);
        next.add(contentId);
        markComplete(contentId);
        markLessonComplete(contentId).catch(console.error);
        return next;
      });
    },
    [markComplete],
  );

  useEffect(() => {
    if (!model || completedIds.size === 0 || chapterCompleteShown.current) return;
    const allIds = model.chapterContent.map((c) => c.elementId);
    if (allIds.length > 0 && allIds.every((id) => completedIds.has(id))) {
      chapterCompleteShown.current = true;
      recordActivity().catch(console.error);
      Alert.alert(t('quiz.chapterCompleteTitle'), t('quiz.chapterCompleteBody'));
    }
  }, [completedIds, model, recordActivity, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !model) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
          {model.chapterName}
        </Text>
        <TouchableOpacity
          testID="ask-tutor"
          onPress={() =>
            (navigation as unknown as { navigate: (name: string, params?: object) => void })
              .navigate('Chat', { context: { courseId, chapterId } })
          }
          style={styles.tutorButton}
        >
          <Icon name="chat" size={16} color={colors.primary} />
          <Text style={[styles.tutorButtonText, { color: colors.primary }]}>
            {t('chat.askTutor')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {model.chapterContent.map((content) => (
          <ContentItem
            key={content.elementId}
            content={content}
            onCompleted={handleContentCompleted}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FontSize.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backButton: {},
  backText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  tutorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  tutorButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  codeHelpButton: { alignSelf: 'center', paddingVertical: Spacing.sm },
  codeHelpText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  feedbackActions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },

  contentSection: { padding: Spacing.lg, marginBottom: Spacing.md },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lessonTitleBlock: { flex: 1, gap: Spacing.xs },
  eyebrow: { letterSpacing: 0.8, textTransform: 'uppercase' },
  fav: { fontSize: 24 },
  h1: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, flex: 1 },

  videoPlaceholder: {
    height: 200,
    backgroundColor: '#000',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.md,
  },
  videoPlaceholderText: { color: 'white', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  questionLoading: { padding: Spacing.lg, alignItems: 'center' },

  completeButton: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  completeButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },

  questionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  questionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  questionPrompt: { marginBottom: Spacing.sm },
  answerList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  answerText: { fontSize: FontSize.md, flex: 1 },
  trueFalseRow: { flexDirection: 'row', gap: Spacing.md },
  trueFalseCol: { flex: 1 },
  trueFalseButton: { justifyContent: 'center', paddingVertical: Spacing.lg },
  trueFalseText: { flex: 0, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  explanation: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  correctMark: { fontSize: 18, fontWeight: FontWeight.bold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  checkButton: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  checkButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },

  codeInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 140,
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    textAlignVertical: 'top',
  },
  gradingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  codeResult: { marginTop: Spacing.md, gap: Spacing.xs },
  codeSummary: { fontSize: FontSize.sm },
  testRow: { marginTop: Spacing.xs },
  testLine: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  testLineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  codeOutput: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: Spacing.xs },

  feedback: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  feedbackText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  feedbackTextRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  retryText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
