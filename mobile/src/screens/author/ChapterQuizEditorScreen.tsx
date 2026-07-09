import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useChapterQuiz, useSetChapterQuiz, useDeleteChapterQuiz } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import type { CreateQuestionRequest } from '@/types/author';
import {
  QuestionEditor,
  emptyQuestion,
  draftToCreateRequest,
  questionToDraft,
  type DraftQuestion,
} from '@/components/author/QuestionEditor';
import { Spacing } from '@/config/theme';
import { Button, Input, Typography } from '@/components/common';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'ChapterQuizEditor'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'ChapterQuizEditor'>;

export function ChapterQuizEditorScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { chapterId, chapterName } = route.params;

  const { data: existing, isLoading } = useChapterQuiz(chapterId);
  const { mutate: save, isPending: isSaving } = useSetChapterQuiz(chapterId);
  const { mutate: remove, isPending: isDeleting } = useDeleteChapterQuiz(chapterId);

  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [threshold, setThreshold] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('0');
  const seeded = useRef(false);
  const hasExisting = !!existing && existing.questions.length > 0;

  // Bestehendes Quiz einmalig zum Vorbefüllen übernehmen (Ersetzen-Semantik).
  useEffect(() => {
    if (seeded.current || !existing) return;
    seeded.current = true;
    if (existing.questions.length > 0) setQuestions(existing.questions.map(questionToDraft));
    setThreshold(String(existing.passThresholdPercent));
    setMaxAttempts(String(existing.maxAttempts));
  }, [existing]);

  const updateQ = (i: number, q: DraftQuestion) =>
    setQuestions((prev) => prev.map((old, idx) => (idx === i ? q : old)));

  const onSave = () => {
    let mapped: CreateQuestionRequest[];
    try {
      mapped = questions.map((q, i) => draftToCreateRequest(q, i));
    } catch (e: any) {
      Alert.alert('Validierung', e.message);
      return;
    }
    const pass = Math.min(100, Math.max(0, parseInt(threshold, 10) || 0));
    const attempts = Math.max(0, parseInt(maxAttempts, 10) || 0);

    save(
      { questions: mapped, passThresholdPercent: pass, maxAttempts: attempts },
      {
        onSuccess: () => {
          Alert.alert('Gespeichert', 'Abschlussquiz wurde gespeichert.');
          navigation.goBack();
        },
        onError: () => Alert.alert('Fehler', 'Quiz konnte nicht gespeichert werden.'),
      },
    );
  };

  const onDelete = () => {
    Alert.alert('Abschlussquiz löschen?', 'Das Kapitel-Quiz und alle Versuche werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: () =>
          remove(undefined, {
            onSuccess: () => {
              Alert.alert('Gelöscht', 'Quiz wurde gelöscht.');
              navigation.goBack();
            },
            onError: () => Alert.alert('Fehler', 'Quiz konnte nicht gelöscht werden.'),
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form}>
          <Typography variant="h2" numberOfLines={1} style={{ marginBottom: Spacing.xs }}>
            Abschlussquiz · {chapterName}
          </Typography>

          <View style={styles.configRow}>
            <Input
              containerStyle={{ flex: 1 }}
              label="Bestehensgrenze (%)"
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Input
              containerStyle={{ flex: 1 }}
              label="Max. Versuche (0 = ∞)"
              value={maxAttempts}
              onChangeText={setMaxAttempts}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              q={q}
              index={i}
              allowCode={false}
              onChange={(updated) => updateQ(i, updated)}
              onRemove={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}

          <Button
            title="Frage hinzufügen"
            variant="secondary"
            iconLeft="add"
            fullWidth
            onPress={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          />

          <Button
            title={hasExisting ? 'Quiz ersetzen' : 'Quiz speichern'}
            onPress={onSave}
            loading={isSaving}
            disabled={isSaving}
            fullWidth
            style={{ marginTop: Spacing.md }}
          />

          {hasExisting && (
            <Button
              title="Abschlussquiz löschen"
              variant="destructive"
              iconLeft="delete"
              onPress={onDelete}
              loading={isDeleting}
              disabled={isDeleting}
              fullWidth
              style={{ marginTop: Spacing.sm }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: Spacing.lg, gap: Spacing.md },
  configRow: { flexDirection: 'row', gap: Spacing.md },
});
