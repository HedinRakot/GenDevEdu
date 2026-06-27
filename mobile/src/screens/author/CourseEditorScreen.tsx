import React from 'react';
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

import { useChapterList, usePublishCourse, useDeleteChapter } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import type { Chapter } from '@/types/course';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'CourseEditor'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'CourseEditor'>;

function ChapterRow({
  chapter,
  onPress,
  onQuiz,
  onDelete,
  deleting,
}: {
  chapter: Chapter;
  onPress: () => void;
  onQuiz: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <TouchableOpacity style={styles.rowMain} onPress={onPress} activeOpacity={0.8}>
        <Text style={[styles.sortOrder, { color: colors.textSecondary }]}>
          {String(chapter.sortOrder).padStart(2, '0')}
        </Text>
        <Text style={[styles.rowTitle, { color: colors.textPrimary, flex: 1 }]}>
          {translate(chapter.titel) || chapter.name}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onQuiz}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.quizButton}
      >
        <Text style={[styles.quizChip, { color: chapter.hasQuiz ? colors.success : colors.primary }]}>
          {chapter.hasQuiz ? '📝 Quiz ✓' : '📝 + Quiz'}
        </Text>
      </TouchableOpacity>
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
    </View>
  );
}

export function CourseEditorScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { courseId, courseName } = route.params;

  const { data: model, isLoading } = useChapterList(courseId);
  const { mutate: publish, isPending: isPublishing } = usePublishCourse();
  const { mutate: removeChapter, isPending: isDeleting } = useDeleteChapter(courseId);

  const onDeleteChapter = (chapter: Chapter) => {
    const label = translate(chapter.titel) || chapter.name;
    Alert.alert(
      'Kapitel löschen?',
      `„${label}" und alle enthaltenen Inhalte werden unwiderruflich gelöscht.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () =>
            removeChapter(chapter.elementId, {
              onError: () => Alert.alert('Fehler', 'Kapitel konnte nicht gelöscht werden.'),
            }),
        },
      ],
    );
  };

  const onPublish = () => {
    Alert.alert('Kurs veröffentlichen?', 'Der Kurs wird für alle Lerner sichtbar.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Veröffentlichen',
        onPress: () =>
          publish(courseId, {
            onSuccess: () => Alert.alert('✓', 'Kurs wurde veröffentlicht.'),
            onError: () => Alert.alert('Fehler', 'Veröffentlichung fehlgeschlagen.'),
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Zurück</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {courseName}
        </Text>
        <TouchableOpacity onPress={onPublish} disabled={isPublishing}>
          <Text style={[styles.publish, { color: isPublishing ? colors.textTertiary : colors.success }]}>
            {isPublishing ? '…' : '▶ Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {(model?.chapters ?? []).map((ch) => (
            <ChapterRow
              key={ch.elementId}
              chapter={ch}
              deleting={isDeleting}
              onPress={() =>
                navigation.navigate('AddChapterContent', {
                  chapterId: ch.elementId,
                  courseId,
                  chapterName: translate(ch.titel) || ch.name,
                })
              }
              onQuiz={() =>
                navigation.navigate('ChapterQuizEditor', {
                  chapterId: ch.elementId,
                  courseId,
                  chapterName: translate(ch.titel) || ch.name,
                })
              }
              onDelete={() => onDeleteChapter(ch)}
            />
          ))}

          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('AddChapter', { courseId })}
          >
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              + Kapitel hinzufügen
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  back: { fontSize: FontSize.md },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, flex: 1, textAlign: 'center' },
  publish: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  sortOrder: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, minWidth: 28 },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  quizButton: { padding: Spacing.xs },
  quizChip: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  deleteButton: { padding: Spacing.xs },
  deleteIcon: { fontSize: FontSize.lg },
  arrow: { fontSize: 24 },
  addButton: {
    marginTop: Spacing.md,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    padding: Spacing.md,
    alignItems: 'center',
  },
  addButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
