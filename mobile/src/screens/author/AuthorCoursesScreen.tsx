import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
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
import { Button, Card, Icon, Typography } from '@/components/common';
import { FontSize, Spacing } from '@/config/theme';

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.row}>
        <View style={styles.rowBody}>
          <Typography variant="label" numberOfLines={1}>
            {translate(course.titel) || course.name}
          </Typography>
          <Typography variant="caption" color="tertiary" numberOfLines={1}>
            {course.name}
          </Typography>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          disabled={deleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteButton}
        >
          <Icon
            name="delete"
            size={FontSize.lg}
            color={deleting ? colors.textTertiary : colors.error}
          />
        </TouchableOpacity>
        <Icon name="chevron-right" size={22} color={colors.textTertiary} />
      </Card>
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
        <View style={styles.titleRow}>
          <Icon name="edit" size={22} color={colors.accent} />
          <Typography variant="h2">Meine Kurse</Typography>
        </View>
        <View style={styles.headerActions}>
          <Button
            testID="author-daily-challenges"
            title="Challenges"
            variant="secondary"
            size="sm"
            iconLeft="challenge"
            onPress={() => navigation.navigate('DailyChallenges')}
          />
          <Button
            testID="author-new-course"
            title="Neu"
            size="sm"
            iconLeft="add"
            onPress={() => navigation.navigate('CreateCourse')}
          />
        </View>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Typography variant="body" color={colors.error}>
            Fehler beim Laden
          </Typography>
          <Button title="Erneut versuchen" variant="ghost" onPress={() => refetch()} />
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
            <Typography variant="body" color="secondary" center style={styles.empty}>
              Noch keine Kurse. Erstelle deinen ersten Kurs!
            </Typography>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowBody: { flex: 1, gap: 2 },
  deleteButton: { padding: Spacing.xs },
  empty: { marginTop: Spacing.xxxl },
});
