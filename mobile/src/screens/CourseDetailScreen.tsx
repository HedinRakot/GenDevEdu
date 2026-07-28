import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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
import { Card, Icon, ProgressBar, Typography } from '@/components/common';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import type { Chapter } from '@/types/course';
import { Radius, Spacing } from '@/config/theme';
import { showScrollIndicator } from '@/utils/platform';

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
    <TouchableOpacity testID="chapter-row" onPress={onPress} activeOpacity={0.85}>
      <Card
        padded={false}
        style={[
          styles.chapterCard,
          isCompleted && {
            backgroundColor: colors.successSurface,
            borderColor: colors.success,
          },
        ]}
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
          {isCompleted ? (
            <Icon name="check" size={18} color={colors.textInverted} strokeWidth={2.5} />
          ) : (
            <Typography variant="label" color="secondary">
              {String(index + 1)}
            </Typography>
          )}
        </View>
        <View style={styles.chapterInfo}>
          <Typography
            variant="label"
            color={isCompleted ? 'tertiary' : 'primary'}
            style={isCompleted ? styles.completedTitle : undefined}
          >
            {title || chapter.name}
          </Typography>
          <Typography variant="caption" color="tertiary" style={styles.chapterMeta}>
            {chapter.rank} Punkte
          </Typography>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      </Card>
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
        <Icon name="x-circle" size={48} color={colors.error} />
        <Typography variant="body" color={colors.error}>
          {t('common.error')}
        </Typography>
      </SafeAreaView>
    );
  }

  const chapters = model.chapters || [];
  const completedCount = chapters.filter((c) => c.completed).length;
  const progress =
    chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={showScrollIndicator} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.breadcrumb}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Typography variant="label" color="secondary">
            {t('courses.title')}
          </Typography>
          <Icon name="chevron-right" size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        <Typography variant="h1" style={styles.title}>
          {model.courseName}
        </Typography>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Typography variant="label">{t('dashboard.progress.title')}</Typography>
            <Typography variant="label" color="accent">
              {progress}%
            </Typography>
          </View>
          <ProgressBar progress={progress} height={8} />
        </Card>

        <Typography variant="h3" style={styles.sectionTitle}>
          {t('courses.chapters')}
        </Typography>

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
                  activeOpacity={0.8}
                >
                  <Icon
                    name={chapter.quizPassed ? 'check-circle' : 'message'}
                    size={16}
                    color={chapter.quizPassed ? colors.success : colors.primary}
                    strokeWidth={2}
                  />
                  <Typography
                    variant="label"
                    color={chapter.quizPassed ? colors.success : colors.primary}
                  >
                    {chapter.quizPassed ? t('chapterQuiz.passed') : t('chapterQuiz.start')}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },

  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  title: { marginBottom: Spacing.lg },

  progressCard: { gap: Spacing.sm, marginBottom: Spacing.xl },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  sectionTitle: { marginBottom: Spacing.md },

  chapterList: { gap: Spacing.sm },
  chapterGroup: { gap: Spacing.xs },

  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  chapterStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterInfo: { flex: 1 },
  completedTitle: { textDecorationLine: 'line-through' },
  chapterMeta: { marginTop: 2 },

  quizEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.xl,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
