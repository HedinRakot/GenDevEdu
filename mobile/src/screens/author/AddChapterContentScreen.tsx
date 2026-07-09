import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

import {
  useAddChapterContent,
  useUpdateChapterContent,
  useChapterContent,
  useDeleteChapterContent,
  useReorderChapterContents,
} from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { ChapterContentType, Language } from '@/types/course';
import type { ChapterContent, TextItem } from '@/types/course';
import { translate } from '@/utils/textUtils';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

const CONTENT_TYPE_LABEL: Record<ChapterContentType, string> = {
  [ChapterContentType.Lesson]: '📖 Lektion',
  [ChapterContentType.Video]: '🎬 Video',
  [ChapterContentType.Questions]: '❓ Quiz',
};

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AddChapterContent'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'AddChapterContent'>;

const CONTENT_TYPES = [
  { label: '📖 Lektion', value: ChapterContentType.Lesson },
  { label: '🎬 Video', value: ChapterContentType.Video },
  { label: '❓ Quiz', value: ChapterContentType.Questions },
];

/** Text einer bestimmten Sprache aus einem lokalisierten items-Array. */
function textFor(items: TextItem[] | undefined, lang: Language): string {
  return items?.find((i) => i.language === lang)?.text ?? '';
}

export function AddChapterContentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { chapterId, courseId, chapterName, editContentId } = route.params;
  const isEdit = !!editContentId;

  const { mutate: add, isPending: isAdding } = useAddChapterContent(chapterId, courseId);
  const { mutate: update, isPending: isUpdating } = useUpdateChapterContent(chapterId, courseId);
  const { data: contentModel } = useChapterContent(chapterId);
  const { mutate: removeContent, isPending: isDeleting } = useDeleteChapterContent(
    chapterId,
    courseId,
  );
  const { mutate: reorderContents, isPending: isReordering } = useReorderChapterContents(
    chapterId,
    courseId,
  );

  const existingContent = contentModel?.chapterContent ?? [];

  /** Tauscht den Inhalt an `index` mit seinem Nachbarn und persistiert die Liste. */
  const moveContent = (index: number, direction: -1 | 1) => {
    const ids = existingContent.map((cc) => cc.elementId);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderContents(ids, {
      onError: () => Alert.alert('Fehler', 'Reihenfolge konnte nicht gespeichert werden.'),
    });
  };
  const editing = isEdit ? existingContent.find((c) => c.elementId === editContentId) : undefined;

  const onDeleteContent = (cc: ChapterContent) => {
    const label = translate(cc.titel) || cc.name;
    Alert.alert('Inhalt löschen?', `„${label}" wird unwiderruflich gelöscht.`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () =>
          removeContent(cc.elementId, {
            onError: () => Alert.alert('Fehler', 'Inhalt konnte nicht gelöscht werden.'),
          }),
      },
    ]);
  };

  const [name, setName] = useState('');
  const [titelDe, setTitelDe] = useState('');
  const [titelEn, setTitelEn] = useState('');
  const [contentType, setContentType] = useState<ChapterContentType>(ChapterContentType.Lesson);
  const [lessonTextDe, setLessonTextDe] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Im Bearbeiten-Modus die Felder aus dem vorhandenen Inhalt vorbefüllen,
  // sobald er geladen ist — aber nur einmal, damit Nutzereingaben nicht
  // durch ein Query-Refetch überschrieben werden.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !editing) return;
    prefilled.current = true;
    setName(editing.name);
    setTitelDe(textFor(editing.titel?.items, Language.German));
    setTitelEn(textFor(editing.titel?.items, Language.English));
    setContentType(editing.contentType);
    setLessonTextDe(textFor(editing.lessonTexte?.items, Language.German) || editing.lessonText || '');
    setVideoUrl(editing.videoUrl ?? '');
  }, [isEdit, editing]);

  const isPending = isAdding || isUpdating;

  const buildReq = () => ({
    name: name.trim(),
    titelItems: [
      { text: titelDe.trim() || name.trim(), language: 1 },
      { text: titelEn.trim() || name.trim(), language: 2 },
    ],
    contentType,
    lessonText: lessonTextDe.trim() || undefined,
    lessonTexteItems: lessonTextDe.trim() ? [{ text: lessonTextDe.trim(), language: 1 }] : undefined,
    videoUrl: videoUrl.trim() || undefined,
    // Keine SortOrder: beim Anlegen hängt das Backend ans Ende an, beim
    // Bearbeiten bleibt die Position erhalten (sortiert wird per ▲/▼).
  });

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name erforderlich');
      return;
    }
    if (isEdit) {
      update(
        { contentId: editContentId!, req: buildReq() },
        {
          onSuccess: () => navigation.goBack(),
          onError: () => Alert.alert('Fehler', 'Änderungen konnten nicht gespeichert werden.'),
        },
      );
      return;
    }
    add(buildReq(), {
      onSuccess: (cc) => {
        if (contentType === ChapterContentType.Questions) {
          navigation.replace('AddQuestionList', {
            chapterContentId: cc.elementId,
            courseId,
          });
        } else {
          navigation.goBack();
        }
      },
      onError: () => Alert.alert('Fehler', 'Inhalt konnte nicht erstellt werden.'),
    });
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
  ];

  const saveLabel = isPending
    ? 'Wird gespeichert…'
    : isEdit
      ? 'Änderungen speichern'
      : contentType === ChapterContentType.Questions
        ? 'Weiter → Fragen hinzufügen'
        : 'Inhalt erstellen';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          {/* Vorhandene Inhalte nur im Anlege-Modus zeigen — antippen = bearbeiten. */}
          {!isEdit && existingContent.length > 0 && (
            <View style={styles.existingSection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Vorhandene Inhalte
              </Text>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Tippen zum Bearbeiten
              </Text>
              {existingContent.map((cc, index) => (
                <View
                  key={cc.elementId}
                  style={[
                    styles.existingRow,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.moveColumn}>
                    <TouchableOpacity
                      testID={`content-move-up-${index}`}
                      onPress={() => moveContent(index, -1)}
                      disabled={index === 0 || isReordering}
                      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.moveIcon,
                          { color: index > 0 && !isReordering ? colors.primary : colors.border },
                        ]}
                      >
                        ▲
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`content-move-down-${index}`}
                      onPress={() => moveContent(index, 1)}
                      disabled={index === existingContent.length - 1 || isReordering}
                      hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.moveIcon,
                          {
                            color:
                              index < existingContent.length - 1 && !isReordering
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        ▼
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.existingMain}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.push('AddChapterContent', {
                        chapterId,
                        courseId,
                        chapterName,
                        editContentId: cc.elementId,
                      })
                    }
                  >
                    <Text style={[styles.existingType, { color: colors.textTertiary }]}>
                      {CONTENT_TYPE_LABEL[cc.contentType]}
                    </Text>
                    <Text
                      style={[styles.existingTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {translate(cc.titel) || cc.name}
                    </Text>
                    <Text style={[styles.editIcon, { color: colors.primary }]}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDeleteContent(cc)}
                    disabled={isDeleting}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[
                        styles.deleteIcon,
                        { color: isDeleting ? colors.textTertiary : colors.error },
                      ]}
                    >
                      🗑
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {isEdit ? 'Inhalt bearbeiten' : 'Neuer Inhalt'}
          </Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>{chapterName}</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Interner Name *</Text>
          <TextInput style={inputStyle} value={name} onChangeText={setName}
            placeholder="z.B. variables-lesson" placeholderTextColor={colors.textTertiary}
            autoCapitalize="none" />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Deutsch)</Text>
          <TextInput style={inputStyle} value={titelDe} onChangeText={setTitelDe}
            placeholder="z.B. Variablen & Typen" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titel (Englisch)</Text>
          <TextInput style={inputStyle} value={titelEn} onChangeText={setTitelEn}
            placeholder="e.g. Variables & Types" placeholderTextColor={colors.textTertiary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Typ</Text>
          {isEdit ? (
            <View style={[styles.lockedType, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: FontWeight.medium }}>
                {CONTENT_TYPE_LABEL[contentType]}
              </Text>
              <Text style={[styles.hint, { color: colors.textTertiary, marginTop: 0 }]}>
                Typ nicht änderbar
              </Text>
            </View>
          ) : (
            <View style={styles.typeRow}>
              {CONTENT_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.value}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: contentType === ct.value ? colors.primary : colors.surface,
                      borderColor: contentType === ct.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setContentType(ct.value)}
                >
                  <Text
                    style={{
                      color: contentType === ct.value ? 'white' : colors.textPrimary,
                      fontWeight: FontWeight.medium,
                    }}
                  >
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {contentType === ChapterContentType.Lesson && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Lektionstext (Markdown, Deutsch)
              </Text>
              <TextInput
                style={[inputStyle, styles.multiline]}
                value={lessonTextDe}
                onChangeText={setLessonTextDe}
                placeholder="**Markdown** wird unterstützt…"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </>
          )}

          {contentType === ChapterContentType.Video && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Video-URL</Text>
              <TextInput style={inputStyle} value={videoUrl} onChangeText={setVideoUrl}
                placeholder="https://…" placeholderTextColor={colors.textTertiary}
                autoCapitalize="none" keyboardType="url" />
            </>
          )}

          {contentType === ChapterContentType.Questions &&
            (isEdit ? (
              <TouchableOpacity
                style={[styles.questionsButton, { borderColor: colors.primary }]}
                onPress={() =>
                  navigation.navigate('AddQuestionList', {
                    chapterContentId: editContentId!,
                    courseId,
                    questionListId: editing?.questionListId || undefined,
                  })
                }
              >
                <Text style={[styles.questionsButtonText, { color: colors.primary }]}>
                  {editing?.questionListId ? '❓ Fragen bearbeiten' : '❓ Fragen hinzufügen'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                ℹ️ Fragen werden im nächsten Schritt hinzugefügt.
              </Text>
            ))}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={onSave}
            disabled={isPending}
          >
            <Text style={styles.saveButtonText}>{saveLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Abbrechen</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  form: { padding: Spacing.lg, gap: Spacing.sm },
  heading: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  subheading: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  existingSection: { marginBottom: Spacing.lg, gap: Spacing.xs },
  existingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  existingMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  moveColumn: { justifyContent: 'center', gap: 2 },
  moveIcon: { fontSize: FontSize.sm, textAlign: 'center' },
  existingType: { fontSize: FontSize.xs },
  existingTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  editIcon: { fontSize: FontSize.md },
  deleteIcon: { fontSize: FontSize.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: Spacing.md },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md },
  multiline: { minHeight: 120 },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeButton: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lockedType: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  hint: { fontSize: FontSize.sm, fontStyle: 'italic', marginTop: Spacing.sm },
  questionsButton: {
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    padding: Spacing.md,
    alignItems: 'center',
  },
  questionsButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  saveButton: { marginTop: Spacing.xl, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  cancelButton: { marginTop: Spacing.sm, alignItems: 'center', padding: Spacing.sm },
  cancelText: { fontSize: FontSize.md },
});
