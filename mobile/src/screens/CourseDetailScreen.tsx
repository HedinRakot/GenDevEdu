import React, { useEffect } from 'react';
import {
  ActivityIndicator,
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

import { useChapterList, useEnrollment } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import type { Chapter } from '@/types/course';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<CoursesStackParamList, 'CourseDetail'>;
type RoutePropType = RouteProp<CoursesStackParamList, 'CourseDetail'>;

function ChapterRow({
  chapter,
  index,
  onPress,
}: {
  chapter: Chapter;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const title = translate(chapter.titel);
  const isCompleted = chapter.completed;

  return (
    <TouchableOpacity
      testID="chapter-row"
      style={[
        styles.chapterRow,
        {
          backgroundColor: isCompleted ? colors.successSurface : colors.surface,
          borderColor: isCompleted ? colors.success : colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.chapterStatus,
          {
            backgroundColor: isCompleted ? colors.success : colors.surfaceElevated,
            borderColor: isCompleted ? colors.success : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.chapterStatusIcon,
            { color: isCompleted ? colors.textInverted : colors.textSecondary },
          ]}
        >
          {isCompleted ? '✓' : String(index + 1)}
        </Text>
      </View>
      <View style={styles.chapterInfo}>
        <Text
          style={[
            styles.chapterTitle,
            {
              color: isCompleted ? colors.textTertiary : colors.textPrimary,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            },
          ]}
        >
          {title || chapter.name}
        </Text>
        <Text style={[styles.chapterMeta, { color: colors.textTertiary }]}>
          {chapter.rank} Punkte
        </Text>
      </View>
      <Text style={[styles.chapterArrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

export function CourseDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const { courseId } = route.params;

  const { data: model, isLoading, error } = useChapterList(courseId);
  const { mutate: enroll } = useEnrollment();

  // Auto-enroll when the user opens a course (idempotent on the backend)
  useEffect(() => {
    enroll(courseId);
  }, [courseId, enroll]);

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

  const chapters = model.chapters || [];
  const completedCount = chapters.filter((c) => c.completed).length;
  const progress =
    chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backIcon, { color: colors.textInverted }]}>
              ‹ {t('common.back')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.heroIcon}>📚</Text>
          <Text style={[styles.heroTitle, { color: colors.textInverted }]}>
            {model.courseName}
          </Text>

          <View style={styles.heroProgress}>
            <View style={styles.heroProgressHeader}>
              <Text style={[styles.heroProgressLabel, { color: colors.textInverted }]}>
                {t('dashboard.progress.title')}
              </Text>
              <Text style={[styles.heroProgressPct, { color: colors.textInverted }]}>
                {progress}%
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              height={8}
              color={colors.textInverted}
              backgroundColor="rgba(255,255,255,0.3)"
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📖 {t('courses.chapters')}
          </Text>
          <View style={styles.chapterList}>
            {chapters.map((chapter, index) => (
              <View key={chapter.elementId} style={styles.chapterGroup}>
                <ChapterRow
                  chapter={chapter}
                  index={index}
                  onPress={() =>
                    navigation.navigate('Lesson', {
                      courseId,
                      chapterId: chapter.elementId,
                      lessonId: '',
                    })
                  }
                />
                {chapter.hasQuiz && (
                  <TouchableOpacity
                    style={[
                      styles.quizEntry,
                      {
                        backgroundColor: chapter.quizPassed ? colors.successSurface : colors.surface,
                        borderColor: chapter.quizPassed ? colors.success : colors.primary,
                      },
                    ]}
                    onPress={() =>
                      navigation.navigate('ChapterQuiz', {
                        courseId,
                        chapterId: chapter.elementId,
                        chapterName: translate(chapter.titel) || chapter.name,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.quizEntryText,
                        { color: chapter.quizPassed ? colors.success : colors.primary },
                      ]}
                    >
                      {chapter.quizPassed
                        ? `📝 ${t('chapterQuiz.passed')}`
                        : `📝 ${t('chapterQuiz.start')}`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FontSize.md },

  hero: { padding: Spacing.lg, paddingTop: Spacing.md },
  backButton: { marginBottom: Spacing.sm },
  backIcon: { fontSize: FontSize.md, fontWeight: FontWeight.medium, opacity: 0.9 },
  heroIcon: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.xs },
  heroProgress: { gap: 6, marginTop: Spacing.md },
  heroProgressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  heroProgressLabel: { fontSize: FontSize.sm, opacity: 0.85 },
  heroProgressPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },

  chapterList: { gap: Spacing.sm },
  chapterGroup: { gap: Spacing.xs },
  quizEntry: {
    marginLeft: Spacing.xl,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  quizEntryText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  chapterStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterStatusIcon: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  chapterMeta: { fontSize: FontSize.xs, marginTop: 2 },
  chapterArrow: { fontSize: 24 },
});
