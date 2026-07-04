import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCourses, useDeleteCourse } from '@/hooks/useCourses';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import type { Course } from '@/types/course';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AuthorCourses'>;

function CourseRow({
  course,
  onPress,
  onDelete,
  deleting,
}: {
  course: Course;
  onPress: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
          {translate(course.titel) || course.name}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>{course.name}</Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        disabled={deleting}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteButton}
      >
        <Text style={[styles.deleteIcon, { color: deleting ? colors.textTertiary : colors.error }]}>
          🗑
        </Text>
      </TouchableOpacity>
      <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
    </TouchableOpacity>
  );
}

export function AuthorCoursesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const { data: courses, isLoading, error, refetch } = useCourses();
  const { mutate: removeCourse, isPending: isDeleting } = useDeleteCourse();

  const myCourses = courses?.filter(
    (c) => user?.role === 'admin' || (c as any).authorId === user?.id,
  ) ?? [];

  const onDeleteCourse = (course: Course) => {
    const label = translate(course.titel) || course.name;
    Alert.alert(
      'Kurs löschen?',
      `„${label}" und alle Kapitel, Inhalte und Lernfortschritte werden unwiderruflich gelöscht.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () =>
            removeCourse(course.elementId, {
              onError: () => Alert.alert('Fehler', 'Kurs konnte nicht gelöscht werden.'),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>✏️ Meine Kurse</Text>
        <TouchableOpacity
          testID="author-new-course"
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateCourse')}
        >
          <Text style={styles.addButtonText}>+ Neu</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>Fehler beim Laden</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: colors.primary }]}>Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={myCourses}
          keyExtractor={(c) => c.elementId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CourseRow
              course={item}
              deleting={isDeleting}
              onPress={() =>
                navigation.navigate('CourseEditor', {
                  courseId: item.elementId,
                  courseName: translate(item.titel) || item.name,
                })
              }
              onDelete={() => onDeleteCourse(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Noch keine Kurse. Erstelle deinen ersten Kurs!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addButton: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  rowMeta: { fontSize: FontSize.xs, marginTop: 2 },
  deleteButton: { padding: Spacing.xs },
  deleteIcon: { fontSize: FontSize.lg },
  arrow: { fontSize: 24 },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
  errorText: { fontSize: FontSize.md },
  retryText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
