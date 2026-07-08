import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

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

  const onSave = () => {
    let mapped: CreateQuestionRequest[];
    try {
      mapped = questions.map((q, i) => draftToCreateRequest(q, i));
    } catch (e: any) {
      Alert.alert('Validierung', e.message);
      return;
    }

    if (isEdit) {
      update(
        { questionListId: questionListId!, questions: mapped },
        {
          onSuccess: () => {
            Alert.alert('✓', 'Fragen wurden aktualisiert.');
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
          Alert.alert('✓', 'Fragenliste wurde gespeichert.');
          navigation.navigate('AuthorCourses');
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
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {isEdit ? 'Fragen bearbeiten' : 'Fragen erstellen'}
          </Text>

          {questions.map((q, i) => (
            <QuestionEditor
              key={i}
              q={q}
              index={i}
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
            disabled={isPending}
          >
            <Text style={styles.saveButtonText}>
              {isPending
                ? 'Wird gespeichert…'
                : isEdit
                  ? 'Änderungen speichern'
                  : 'Fragenliste speichern'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: Spacing.lg, gap: Spacing.md },
  heading: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
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
});
