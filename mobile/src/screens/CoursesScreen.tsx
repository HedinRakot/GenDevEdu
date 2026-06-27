import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
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
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<CoursesStackParamList, 'CoursesList'>;

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = translate(course.titel);
  const accent = course.elementId.includes('js') ? '#F7DF1E' : '#3178C6';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.stripe, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: accent + '22' }]}>
            <Text style={styles.cardIcon}>
              {course.elementId.includes('js') ? '📜' : '🔷'}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {title || course.name}
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {t('courses.allCourses')}
        </Text>
        <Text style={[styles.startButtonText, { color: colors.primary }]}>
          {t('courses.startCourse')} →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function CoursesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { data: courses, isLoading, error, refetch } = useCourses();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>{t('common.error')}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={[styles.retryText, { color: colors.textInverted }]}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.elementId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
              {t('courses.title')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              {t('courses.subtitle')}
            </Text>
            <TouchableOpacity
              style={[styles.glossaryBtn, { backgroundColor: colors.primarySurface }]}
              onPress={() => navigation.navigate('Glossary')}
            >
              <Text style={[styles.glossaryBtnText, { color: colors.primary }]}>
                📖 {t('glossary.title')}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.elementId })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  listHeader: { marginBottom: Spacing.lg },
  screenTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  screenSubtitle: { fontSize: FontSize.md, marginTop: 4 },
  glossaryBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  glossaryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

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
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 4 },
  cardDescription: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
  startButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  loadingText: { fontSize: FontSize.md },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: FontSize.md },
  retryButton: { borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  retryText: { fontWeight: FontWeight.bold },
});
