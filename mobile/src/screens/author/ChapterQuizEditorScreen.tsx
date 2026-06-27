import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { useChapterQuiz, useSetChapterQuiz, useDeleteChapterQuiz } from '@/hooks/useCourses';
import { useTheme } from '@/context/ThemeContext';
import { translate } from '@/utils/textUtils';
import type { AuthorStackParamList } from '@/navigation/AuthorStack';
import type { CreateQuestionRequest } from '@/types/author';
import type { Question } from '@/types/course';
import {
  QuestionEditor,
  emptyQuestion,
  draftToCreateRequest,
  type DraftQuestion,
} from '@/components/author/QuestionEditor';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

type NavProp = NativeStackNavigationProp<AuthorStackParamList, 'ChapterQuizEditor'>;
type RoutePropType = RouteProp<AuthorStackParamList, 'ChapterQuizEditor'>;

function questionToDraft(q: Question): DraftQuestion {
  return {
    name: q.name ?? '',
    titleDe: translate(q.titel),
    questionType: q.questionType,
    answers: q.answers.map((a) => ({ text: translate(a.titel), isCorrect: a.isCorrect })),
  };
}

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
          Alert.alert('✓', 'Abschlussquiz wurde gespeichert.');
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
              Alert.alert('✓', 'Quiz wurde gelöscht.');
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

  const numInput = [
    styles.numInput,
    { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.heading, { color: colors.textPrimary }]} numberOfLines={1}>
            Abschlussquiz · {chapterName}
          </Text>

          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bestehensgrenze (%)</Text>
              <TextInput
                style={numInput}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.configField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Max. Versuche (0 = ∞)</Text>
              <TextInput
                style={numInput}
                value={maxAttempts}
                onChangeText={setMaxAttempts}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
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

          <TouchableOpacity
            style={[styles.addQButton, { borderColor: colors.primary }]}
            onPress={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            <Text style={[styles.addQText, { color: colors.primary }]}>+ Frage hinzufügen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={onSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Wird gespeichert…' : hasExisting ? 'Quiz ersetzen' : 'Quiz speichern'}
            </Text>
          </TouchableOpacity>

          {hasExisting && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete} disabled={isDeleting}>
              <Text style={[styles.deleteText, { color: colors.error }]}>
                {isDeleting ? 'Wird gelöscht…' : 'Abschlussquiz löschen'}
              </Text>
            </TouchableOpacity>
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
  heading: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  configRow: { flexDirection: 'row', gap: Spacing.md },
  configField: { flex: 1, gap: Spacing.xs },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  numInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, fontSize: FontSize.md },
  addQButton: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    padding: Spacing.md,
    alignItems: 'center',
  },
  addQText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  saveButton: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  saveButtonText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  deleteButton: { padding: Spacing.md, alignItems: 'center' },
  deleteText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
