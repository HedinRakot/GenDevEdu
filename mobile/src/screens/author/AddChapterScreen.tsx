import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAddChapter, useUpdateChapter, useChapterList } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { Language } from '@/types/course';
import type { TextItem } from '@/types/course';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import { Spacing } from '@/config/theme';
import { Button, Input, Typography } from '@/components/common';

/** Text einer bestimmten Sprache aus einem lokalisierten items-Array. */
function textFor(items: TextItem[] | undefined, lang: Language): string {
  return items?.find((i) => i.language === lang)?.text ?? '';
}

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AddChapter'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'AddChapter'>;

export function AddChapterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { courseId, chapterId } = route.params;
  const isEdit = !!chapterId;

  const { mutate: add, isPending: isAdding } = useAddChapter(courseId);
  const { mutate: update, isPending: isUpdating } = useUpdateChapter(courseId);
  const { data: chapterModel } = useChapterList(courseId);
  const isPending = isAdding || isUpdating;

  const [name, setName] = useState('');
  const [titelDe, setTitelDe] = useState('');
  const [titelEn, setTitelEn] = useState('');
  const [titelRu, setTitelRu] = useState('');

  const MAX_LEN = 120;

  // Edit-Modus: Felder aus dem vorhandenen Kapitel vorbefüllen (nur einmal).
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !chapterModel) return;
    const ch = chapterModel.chapters.find((c) => c.elementId === chapterId);
    if (!ch) return;
    prefilled.current = true;
    setName(ch.name);
    setTitelDe(textFor(ch.titel?.items, Language.German));
    setTitelEn(textFor(ch.titel?.items, Language.English));
    setTitelRu(textFor(ch.titel?.items, Language.Russian));
  }, [isEdit, chapterModel, chapterId]);

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name erforderlich', 'Bitte einen internen Namen angeben.');
      return;
    }
    if (!titelDe.trim()) {
      Alert.alert('Titel erforderlich', 'Bitte mindestens den deutschen Titel angeben.');
      return;
    }
    if ([name, titelDe, titelEn, titelRu].some((v) => v.trim().length > MAX_LEN)) {
      Alert.alert('Zu lang', `Name/Titel dürfen höchstens ${MAX_LEN} Zeichen haben.`);
      return;
    }
    // Enum: RU=0, DE=1, EN=2. RU nur mitsenden, wenn ausgefüllt.
    const titelItems = [
      { text: titelDe.trim(), language: 1 },
      { text: titelEn.trim() || titelDe.trim(), language: 2 },
      ...(titelRu.trim() ? [{ text: titelRu.trim(), language: 0 }] : []),
    ];
    // Keine SortOrder: beim Anlegen hängt das Backend ans Ende an, beim Bearbeiten
    // bleibt die Position erhalten (sortiert wird per Reorder-Endpoint).
    const req = { name: name.trim(), titelItems, show: true };
    const handlers = {
      onSuccess: () => navigation.goBack(),
      onError: () =>
        Alert.alert('Fehler', isEdit ? 'Kapitel konnte nicht gespeichert werden.' : 'Kapitel konnte nicht erstellt werden.'),
    };
    if (isEdit) update({ chapterId: chapterId!, req }, handlers);
    else add(req, handlers);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <Typography variant="h2" style={{ marginBottom: Spacing.sm }}>
            {isEdit ? 'Kapitel bearbeiten' : 'Neues Kapitel'}
          </Typography>

          <Input
            label="Interner Name *"
            value={name}
            onChangeText={setName}
            placeholder="z.B. introduction"
            autoCapitalize="none"
          />

          <Input
            label="Titel (Deutsch) *"
            value={titelDe}
            onChangeText={setTitelDe}
            placeholder="z.B. Einführung"
            maxLength={MAX_LEN}
          />

          <Input
            label="Titel (Englisch)"
            value={titelEn}
            onChangeText={setTitelEn}
            placeholder="e.g. Introduction"
            maxLength={MAX_LEN}
          />

          <Input
            label="Titel (Russisch)"
            value={titelRu}
            onChangeText={setTitelRu}
            placeholder="напр. Введение"
            maxLength={MAX_LEN}
          />

          <Button
            title={isEdit ? 'Änderungen speichern' : 'Kapitel erstellen'}
            onPress={onSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
            iconRight="arrow-right"
            style={{ marginTop: Spacing.lg }}
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
  form: { padding: Spacing.lg, gap: Spacing.md },
});
