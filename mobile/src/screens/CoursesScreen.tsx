import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useCourses } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import type { CoursesStackParamList } from '@/navigation/CoursesStack';
import type { Course } from '@/types/course';
import { Badge, Button, Icon, Typography } from '@/components/common';
import { FontSize, Radius, Shadow, Spacing } from '@/config/theme';
import { showScrollIndicator } from '@/utils/platform';

type NavProp = NativeStackNavigationProp<CoursesStackParamList, 'CoursesList'>;

const LEVEL_LABEL: Record<string, string> = {
  Beginner: 'courses.beginner',
  Intermediate: 'courses.intermediate',
  Advanced: 'courses.advanced',
};

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = translate(course.titel);
  // Sprach-Markenfarben (JS-Gelb / TS-Blau) – bewusst NICHT themebar.
  const accent = course.elementId.includes('js') ? '#F7DF1E' : '#3178C6';

  return (
    <TouchableOpacity
      testID="course-card"
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: accent + '22' }]}>
            <Icon name="courses" size={22} color={accent} />
          </View>
          {!!course.level && (
            <Badge label={t(LEVEL_LABEL[course.level] ?? course.level)} tone="default" />
          )}
        </View>
        <Typography testID="course-card-title" variant="h3" numberOfLines={2}>
          {title || course.name}
        </Typography>
        {course.tags.length > 0 && (
          <Typography
            variant="caption"
            color="tertiary"
            numberOfLines={1}
            style={styles.cardTags}
          >
            {course.tags.map((tg) => `#${tg}`).join('  ')}
          </Typography>
        )}
        <View style={styles.startRow}>
          <Typography variant="label" color={colors.primary}>
            {t('courses.startCourse')}
          </Typography>
          <Icon name="arrow-right" size={FontSize.sm + 2} color={colors.primary} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function CoursesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();

  const { data: courses, isLoading, error, refetch } = useCourses();

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Icon name="x-circle" size={48} color={colors.error} />
        <Typography variant="body" color={colors.error}>
          {t('common.error')}
        </Typography>
        <Button title={t('common.retry')} onPress={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={courses ?? []}
        keyExtractor={(item) => item.elementId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={showScrollIndicator}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Typography variant="h1">{t('courses.title')}</Typography>
            <Typography variant="body" color="secondary">
              {t('courses.subtitle')}
            </Typography>
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.elementId })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <Typography variant="body" color="secondary" center style={styles.empty}>
              {t('courses.noResults')}
            </Typography>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl },

  listHeader: { marginBottom: Spacing.md, gap: Spacing.xs },

  card: { borderRadius: Radius.xl, overflow: 'hidden', flexDirection: 'row', ...Shadow.md },
  stripe: { width: 6 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTags: { marginBottom: Spacing.sm },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

  empty: { marginTop: Spacing.xl },
});
