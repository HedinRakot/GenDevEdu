import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';
import { QuestionType } from '@/types/course';
import type { Question } from '@/types/course';
import type { CreateAnswerRequest, CreateQuestionRequest } from '@/types/author';
import { translate } from '@/utils/textUtils';
import { FontSize, FontWeight, Radius, Spacing } from '@/config/theme';

// ─── Draft-Modelle (lokaler Editor-Zustand) ──────────────────────────────────

export interface DraftAnswer {
  text: string;
  isCorrect: boolean;
}

export interface DraftTestCase {
  input: string;
  expectedOutput: string;
  hidden: boolean;
}

export interface DraftCode {
  starterCode: string;
  solutionCode: string;
  testCases: DraftTestCase[];
}

export interface DraftQuestion {
  name: string;
  titleDe: string;
  questionType: QuestionType;
  answers: DraftAnswer[];
  code?: DraftCode;
}

export function emptyQuestion(): DraftQuestion {
  return {
    name: '',
    titleDe: '',
    questionType: QuestionType.OneChoice,
    answers: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  };
}

export function emptyCode(): DraftCode {
  return {
    starterCode: '',
    solutionCode: '',
    testCases: [{ input: '', expectedOutput: '', hidden: false }],
  };
}

/** Wandelt einen Draft in einen CreateQuestionRequest um; wirft bei Validierungsfehlern. */
export function draftToCreateRequest(q: DraftQuestion, index: number): CreateQuestionRequest {
  if (!q.titleDe.trim()) throw new Error(`Frage ${index + 1}: Fragetext fehlt`);
  const base = {
    name: q.name.trim() || `Q${index + 1}`,
    titelItems: [{ text: q.titleDe.trim(), language: 1 }],
    questionType: q.questionType,
  };

  if (q.questionType === QuestionType.Code) {
    const c = q.code ?? emptyCode();
    const testCases = c.testCases
      .filter((tc) => tc.expectedOutput.trim() !== '' || tc.input.trim() !== '')
      .map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput, hidden: tc.hidden }));
    if (testCases.length === 0) {
      throw new Error(`Frage ${index + 1}: mindestens ein Testfall mit erwarteter Ausgabe nötig`);
    }
    return {
      ...base,
      answers: [],
      code: { language: 0, starterCode: c.starterCode, solutionCode: c.solutionCode, testCases },
    };
  }

  if (q.questionType === QuestionType.TrueFalse) {
    const trueIsCorrect = q.answers[0]?.isCorrect ?? true;
    return {
      ...base,
      answers: [
        { isCorrect: trueIsCorrect, titelItems: [{ text: 'Wahr', language: 1 }, { text: 'True', language: 2 }] },
        { isCorrect: !trueIsCorrect, titelItems: [{ text: 'Falsch', language: 1 }, { text: 'False', language: 2 }] },
      ],
    };
  }

  const answers = q.answers
    .filter((a) => a.text.trim())
    .map((a): CreateAnswerRequest => ({
      isCorrect: a.isCorrect,
      titelItems: [{ text: a.text.trim(), language: 1 }],
    }));
  if (answers.length < 2) throw new Error(`Frage ${index + 1}: mindestens zwei Antworten nötig`);
  if (!answers.some((a) => a.isCorrect)) throw new Error(`Frage ${index + 1}: keine korrekte Antwort markiert`);
  return { ...base, answers };
}

/**
 * Wandelt eine geladene (Autor-)Frage in einen editierbaren Draft zurück —
 * Umkehrung von draftToCreateRequest. Rekonstruiert bei Code-Fragen auch
 * Lösungscode + Testfälle (der Autor-GET liefert diese vollständig).
 */
export function questionToDraft(q: Question): DraftQuestion {
  const base: DraftQuestion = {
    name: q.name ?? '',
    titleDe: translate(q.titel),
    questionType: q.questionType,
    answers: (q.answers ?? []).map((a) => ({ text: translate(a.titel), isCorrect: a.isCorrect })),
  };
  if (q.questionType === QuestionType.Code && q.code) {
    return {
      ...base,
      answers: [],
      code: {
        starterCode: q.code.starterCode ?? '',
        solutionCode: q.code.solutionCode ?? '',
        testCases: (q.code.testCases ?? []).map((tc) => ({
          input: tc.input ?? '',
          expectedOutput: tc.expectedOutput ?? '',
          hidden: tc.hidden,
        })),
      },
    };
  }
  return base;
}

// ─── Editor-Komponente ────────────────────────────────────────────────────────

export function QuestionEditor({
  q,
  index,
  onChange,
  onRemove,
  allowCode = true,
}: {
  q: DraftQuestion;
  index: number;
  onChange: (q: DraftQuestion) => void;
  onRemove: () => void;
  /** Code-Fragen erlauben? Für Kapitel-Abschlussquizze false (nur auto-bewertbar). */
  allowCode?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border },
  ];

  const isTrueFalse = q.questionType === QuestionType.TrueFalse;
  const isCode = q.questionType === QuestionType.Code;

  const updateAnswer = (ai: number, partial: Partial<DraftAnswer>) => {
    const answers = q.answers.map((a, i) => (i === ai ? { ...a, ...partial } : a));
    const singleSelect =
      q.questionType === QuestionType.OneChoice || q.questionType === QuestionType.TrueFalse;
    if (partial.isCorrect && singleSelect) {
      onChange({ ...q, answers: answers.map((a, i) => ({ ...a, isCorrect: i === ai })) });
    } else {
      onChange({ ...q, answers });
    }
  };

  const changeType = (questionType: QuestionType) => {
    if (questionType === q.questionType) return;
    if (questionType === QuestionType.Code) {
      onChange({ ...q, questionType, answers: [], code: q.code ?? emptyCode() });
    } else if (questionType === QuestionType.TrueFalse) {
      onChange({
        ...q,
        questionType,
        code: undefined,
        answers: [
          { text: 'Wahr', isCorrect: true },
          { text: 'Falsch', isCorrect: false },
        ],
      });
    } else {
      const answers =
        q.questionType === QuestionType.OneChoice || q.questionType === QuestionType.MultipleChoice
          ? q.answers
          : emptyQuestion().answers;
      onChange({ ...q, questionType, code: undefined, answers });
    }
  };

  const updateCode = (partial: Partial<DraftCode>) =>
    onChange({ ...q, code: { ...(q.code ?? emptyCode()), ...partial } });

  const updateTestCase = (ti: number, partial: Partial<DraftTestCase>) => {
    const code = q.code ?? emptyCode();
    updateCode({ testCases: code.testCases.map((tc, i) => (i === ti ? { ...tc, ...partial } : tc)) });
  };

  const typeOptions = [
    { label: 'Single Choice', value: QuestionType.OneChoice },
    { label: 'Multiple Choice', value: QuestionType.MultipleChoice },
    { label: 'Wahr/Falsch', value: QuestionType.TrueFalse },
    ...(allowCode ? [{ label: 'Code', value: QuestionType.Code }] : []),
  ];

  return (
    <View style={[styles.questionBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.questionHeader}>
        <Text style={[styles.questionNum, { color: colors.textSecondary }]}>Frage {index + 1}</Text>
        <TouchableOpacity onPress={onRemove}>
          <Text style={{ color: colors.error, fontSize: FontSize.sm }}>✕ Entfernen</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Fragetext (Deutsch) *</Text>
      <TextInput
        style={[inputStyle, styles.multiline]}
        value={q.titleDe}
        onChangeText={(v) => onChange({ ...q, titleDe: v })}
        placeholder="Welches Schlüsselwort …?"
        placeholderTextColor={colors.textTertiary}
        multiline
      />

      <View style={styles.typeRow}>
        {typeOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.typeChip,
              {
                backgroundColor: q.questionType === opt.value ? colors.primary : colors.surface,
                borderColor: q.questionType === opt.value ? colors.primary : colors.border,
              },
            ]}
            onPress={() => changeType(opt.value)}
          >
            <Text style={{ color: q.questionType === opt.value ? 'white' : colors.textPrimary, fontSize: FontSize.xs }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isCode ? (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Sprache</Text>
          <View style={styles.typeRow}>
            <View style={[styles.typeChip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={{ color: 'white', fontSize: FontSize.xs }}>C#</Text>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Starter-Code</Text>
          <TextInput
            style={[inputStyle, styles.codeArea]}
            value={q.code?.starterCode ?? ''}
            onChangeText={(v) => updateCode({ starterCode: v })}
            placeholder={'var n = int.Parse(Console.ReadLine()!);'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Lösungs-Code (autor-intern)</Text>
          <TextInput
            style={[inputStyle, styles.codeArea]}
            value={q.code?.solutionCode ?? ''}
            onChangeText={(v) => updateCode({ solutionCode: v })}
            placeholder={'Console.WriteLine(n * 2);'}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Testfälle</Text>
          {(q.code ?? emptyCode()).testCases.map((tc, ti) => (
            <View key={ti} style={[styles.testCaseBox, { borderColor: colors.border }]}>
              <View style={styles.questionHeader}>
                <TouchableOpacity style={styles.answerRow} onPress={() => updateTestCase(ti, { hidden: !tc.hidden })}>
                  <View style={[styles.correctToggle, { borderColor: tc.hidden ? colors.primary : colors.border }]}>
                    {tc.hidden && <Text style={{ color: colors.primary, fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Versteckt</Text>
                </TouchableOpacity>
                {(q.code?.testCases.length ?? 0) > 1 && (
                  <TouchableOpacity onPress={() => updateCode({ testCases: q.code!.testCases.filter((_, i) => i !== ti) })}>
                    <Text style={{ color: colors.error, fontSize: FontSize.sm }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[inputStyle, styles.codeArea]}
                value={tc.input}
                onChangeText={(v) => updateTestCase(ti, { input: v })}
                placeholder="Eingabe (stdin)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <TextInput
                style={[inputStyle, styles.codeArea]}
                value={tc.expectedOutput}
                onChangeText={(v) => updateTestCase(ti, { expectedOutput: v })}
                placeholder="Erwartete Ausgabe (stdout)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={() =>
              updateCode({
                testCases: [...(q.code ?? emptyCode()).testCases, { input: '', expectedOutput: '', hidden: false }],
              })
            }
            style={styles.addAnswerButton}
          >
            <Text style={[styles.addAnswerText, { color: colors.primary }]}>+ Testfall hinzufügen</Text>
          </TouchableOpacity>
        </>
      ) : isTrueFalse ? (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Korrekte Antwort</Text>
          {q.answers.map((a, ai) => (
            <TouchableOpacity key={ai} style={styles.answerRow} onPress={() => updateAnswer(ai, { isCorrect: true })}>
              <View style={[styles.correctToggle, { borderColor: a.isCorrect ? colors.success : colors.border }]}>
                {a.isCorrect && <Text style={{ color: colors.success, fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={[styles.trueFalseLabel, { color: colors.textPrimary }]}>
                {t(ai === 0 ? 'quiz.true' : 'quiz.false')}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Antworten</Text>
          {q.answers.map((a, ai) => (
            <View key={ai} style={styles.answerRow}>
              <TouchableOpacity
                style={[styles.correctToggle, { borderColor: a.isCorrect ? colors.success : colors.border }]}
                onPress={() => updateAnswer(ai, { isCorrect: !a.isCorrect })}
              >
                {a.isCorrect && <Text style={{ color: colors.success, fontSize: 12 }}>✓</Text>}
              </TouchableOpacity>
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                value={a.text}
                onChangeText={(v) => updateAnswer(ai, { text: v })}
                placeholder={`Antwort ${ai + 1}`}
                placeholderTextColor={colors.textTertiary}
              />
              {q.answers.length > 2 && (
                <TouchableOpacity onPress={() => onChange({ ...q, answers: q.answers.filter((_, i) => i !== ai) })}>
                  <Text style={{ color: colors.error, paddingHorizontal: Spacing.sm }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => onChange({ ...q, answers: [...q.answers, { text: '', isCorrect: false }] })}
            style={styles.addAnswerButton}
          >
            <Text style={[styles.addAnswerText, { color: colors.primary }]}>+ Antwort hinzufügen</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  questionBox: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, fontSize: FontSize.sm },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  codeArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  testCaseBox: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, gap: Spacing.xs },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  typeChip: { borderWidth: 1.5, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trueFalseLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  correctToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAnswerButton: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  addAnswerText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
