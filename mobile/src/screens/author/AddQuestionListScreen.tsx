import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCreateQuestionList, useUpdateQuestionList, useQuestions } from '@/hooks/useCourses';
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
import { Button, Typography } from '@/components/common';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'AddQuestionList'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'AddQuestionList'>;

export function AddQuestionListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { chapterContentId, questionListId } = route.params;
  const isEdit = !!questionListId;

  const { mutate: create, isPending: isCreating } = useCreateQuestionList();
  const { mutate: update, isPending: isUpdating } = useUpdateQuestionList();
  const { data: existing, isLoading } = useQuestions(questionListId);

  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  // Bestehende Fragen einmalig zum Bearbeiten vorbefüllen (Replace-Semantik).
  const seeded = useRef(false);
  useEffect(() => {
    if (!isEdit || seeded.current || !existing) return;
    seeded.current = true;
    if (existing.questions.length > 0) setQuestions(existing.questions.map(questionToDraft));
  }, [isEdit, existing]);

  const isPending = isCreating || isUpdating;

  const updateQ = (i: number, q: DraftQuestion) =>
    setQuestions((prev) => prev.map((old, idx) => (idx === i ? q : old)));

  /** Frage um dir (−1 hoch / +1 runter) verschieben (Array-Reihenfolge = Persistenz-Reihenfolge). */
  const moveQ = (i: number, dir: -1 | 1) =>
    setQuestions((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onSave = () => {
    // #12: ALLE ungültigen Fragen sammeln (nicht beim ersten Fehler abbrechen).
    const mapped: CreateQuestionRequest[] = [];
    const errors: string[] = [];
    questions.forEach((q, i) => {
      try {
        mapped.push(draftToCreateRequest(q, i));
      } catch (e: any) {
        errors.push(e.message);
      }
    });
    if (errors.length > 0) {
      Alert.alert('Validierung', errors.join('\n'));
      return;
    }

    if (isEdit) {
      update(
        { questionListId: questionListId!, questions: mapped },
        {
          onSuccess: () => {
            Alert.alert('Gespeichert', 'Fragen wurden aktualisiert.');
            navigation.goBack();
          },
          onError: () => Alert.alert('Fehler', 'Fragen konnten nicht gespeichert werden.'),
        },
      );
      return;
    }

    create(
      { chapterContentId, questions: mapped },
      {
        onSuccess: () => {
          Alert.alert('Gespeichert', 'Fragenliste wurde gespeichert.');
          // #12: im Kontext bleiben (zum Inhalts-Editor zurück), damit das Quiz
          // direkt weiter editierbar ist — statt raus zur Kursliste.
          navigation.goBack();
        },
        onError: () => Alert.alert('Fehler', 'Fragenliste konnte nicht gespeichert werden.'),
      },
    );
  };

  if (isEdit && isLoading) {
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
          <Typography variant="h2" style={{ marginBottom: Spacing.xs }}>
            {isEdit ? 'Fragen bearbeiten' : 'Fragen erstellen'}
          </Typography>

          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              q={q}
              index={i}
              onChange={(updated) => updateQ(i, updated)}
              onRemove={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
              onMoveUp={i > 0 ? () => moveQ(i, -1) : undefined}
              onMoveDown={i < questions.length - 1 ? () => moveQ(i, 1) : undefined}
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
            title={isEdit ? 'Änderungen speichern' : 'Fragenliste speichern'}
            onPress={onSave}
            loading={isPending}
            disabled={isPending}
            fullWidth
            iconRight="arrow-right"
            style={{ marginTop: Spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: Spacing.lg, gap: Spacing.md },
});
