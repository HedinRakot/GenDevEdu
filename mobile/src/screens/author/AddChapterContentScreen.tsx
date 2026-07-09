import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import { Radius, Spacing } from '@/config/theme';
import { Button, Card, Icon, Input, Typography, type IconName } from '@/components/common';

/** Icon + Label je Inhaltstyp (löst die früheren Emoji-Labels ab). */
const CONTENT_TYPE_META: Record<ChapterContentType, { icon: IconName; label: string }> = {
  [ChapterContentType.Lesson]: { icon: 'courses', label: 'Lektion' },
  [ChapterContentType.Video]: { icon: 'play', label: 'Video' },
  [ChapterContentType.Questions]: { icon: 'message', label: 'Quiz' },
};

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AddChapterContent'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'AddChapterContent'>;

const CONTENT_TYPES = [
  { icon: CONTENT_TYPE_META[ChapterContentType.Lesson].icon, label: 'Lektion', value: ChapterContentType.Lesson },
  { icon: CONTENT_TYPE_META[ChapterContentType.Video].icon, label: 'Video', value: ChapterContentType.Video },
  { icon: CONTENT_TYPE_META[ChapterContentType.Questions].icon, label: 'Quiz', value: ChapterContentType.Questions },
] as const;

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
    // Bearbeiten bleibt die Position erhalten (sortiert wird per Pfeil).
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

  const saveLabel = isEdit
    ? 'Änderungen speichern'
    : contentType === ChapterContentType.Questions
      ? 'Weiter: Fragen hinzufügen'
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
              <Typography variant="label" color="secondary">
                Vorhandene Inhalte
              </Typography>
              <Typography variant="caption" color="tertiary">
                Tippen zum Bearbeiten
              </Typography>
              {existingContent.map((cc, index) => {
                const meta = CONTENT_TYPE_META[cc.contentType];
                const canUp = index > 0 && !isReordering;
                const canDown = index < existingContent.length - 1 && !isReordering;
                return (
                  <Card key={cc.elementId} padded={false} style={styles.existingRow}>
                    <View style={styles.moveColumn}>
                      <TouchableOpacity
                        testID={`content-move-up-${index}`}
                        onPress={() => moveContent(index, -1)}
                        disabled={index === 0 || isReordering}
                        hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                      >
                        <View style={styles.chevronUp}>
                          <Icon
                            name="chevron-down"
                            size={16}
                            color={canUp ? colors.primary : colors.border}
                          />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`content-move-down-${index}`}
                        onPress={() => moveContent(index, 1)}
                        disabled={index === existingContent.length - 1 || isReordering}
                        hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                      >
                        <Icon
                          name="chevron-down"
                          size={16}
                          color={canDown ? colors.primary : colors.border}
                        />
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
                      <Icon name={meta.icon} size={18} color={colors.textTertiary} />
                      <Typography variant="label" numberOfLines={1} style={{ flex: 1 }}>
                        {translate(cc.titel) || cc.name}
                      </Typography>
                      <Icon name="edit" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDeleteContent(cc)}
                      disabled={isDeleting}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="delete"
                        size={18}
                        color={isDeleting ? colors.textTertiary : colors.error}
                      />
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </View>
          )}

          <Typography variant="h2">{isEdit ? 'Inhalt bearbeiten' : 'Neuer Inhalt'}</Typography>
          <Typography variant="bodySm" color="secondary" style={{ marginBottom: Spacing.sm }}>
            {chapterName}
          </Typography>

          <Input
            label="Interner Name *"
            value={name}
            onChangeText={setName}
            placeholder="z.B. variables-lesson"
            autoCapitalize="none"
          />

          <Input
            label="Titel (Deutsch)"
            value={titelDe}
            onChangeText={setTitelDe}
            placeholder="z.B. Variablen & Typen"
          />

          <Input
            label="Titel (Englisch)"
            value={titelEn}
            onChangeText={setTitelEn}
            placeholder="e.g. Variables & Types"
          />

          <Typography variant="label" color="secondary" style={{ marginTop: Spacing.sm }}>
            Typ
          </Typography>
          {isEdit ? (
            <View
              style={[
                styles.lockedType,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ]}
            >
              <View style={styles.lockedTypeRow}>
                <Icon name={CONTENT_TYPE_META[contentType].icon} size={18} color={colors.textPrimary} />
                <Typography variant="label">{CONTENT_TYPE_META[contentType].label}</Typography>
              </View>
              <Typography variant="caption" color="tertiary">
                Typ nicht änderbar
              </Typography>
            </View>
          ) : (
            <View style={styles.typeRow}>
              {CONTENT_TYPES.map((ct) => {
                const selected = contentType === ct.value;
                return (
                  <TouchableOpacity
                    key={ct.value}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setContentType(ct.value)}
                  >
                    <Icon
                      name={ct.icon}
                      size={16}
                      color={selected ? colors.textInverted : colors.textPrimary}
                    />
                    <Typography variant="label" color={selected ? 'inverted' : 'primary'}>
                      {ct.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {contentType === ChapterContentType.Lesson && (
            <Input
              label="Lektionstext (Markdown, Deutsch)"
              value={lessonTextDe}
              onChangeText={setLessonTextDe}
              placeholder="**Markdown** wird unterstützt…"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={styles.multiline}
            />
          )}

          {contentType === ChapterContentType.Video && (
            <Input
              label="Video-URL"
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://…"
              autoCapitalize="none"
              keyboardType="url"
            />
          )}

          {contentType === ChapterContentType.Questions &&
            (isEdit ? (
              <Button
                title={editing?.questionListId ? 'Fragen bearbeiten' : 'Fragen hinzufügen'}
                variant="secondary"
                iconLeft="message"
                onPress={() =>
                  navigation.navigate('AddQuestionList', {
                    chapterContentId: editContentId!,
                    courseId,
                    questionListId: editing?.questionListId || undefined,
                  })
                }
                style={{ marginTop: Spacing.sm }}
              />
            ) : (
              <Typography variant="caption" color="tertiary" style={{ marginTop: Spacing.sm }}>
                Fragen werden im nächsten Schritt hinzugefügt.
              </Typography>
            ))}

          <Button
            title={saveLabel}
            onPress={onSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
            iconRight="arrow-right"
            style={{ marginTop: Spacing.xl }}
          />

          <Button
            title="Abbrechen"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ alignSelf: 'center', marginTop: Spacing.xs }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  form: { padding: Spacing.lg, gap: Spacing.sm },
  existingSection: { marginBottom: Spacing.lg, gap: Spacing.xs },
  existingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  existingMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  moveColumn: { justifyContent: 'center', gap: 2 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
    gap: Spacing.xs,
  },
  lockedTypeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  multiline: { minHeight: 120 },
});
