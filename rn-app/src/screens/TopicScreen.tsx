import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import { api, ApiError } from "../api";
import { useCourseDetail } from "../hooks/useCourseDetail";
import type { AnswerPayload, AttemptResult, Question } from "../types";
import type { RootStackParamList } from "../navigation";

type Props = {
  route: RouteProp<RootStackParamList, "Topic">;
};

// ── QuestionItem ─────────────────────────────────────────────────────────────

function QuestionItem({ question }: { question: Question }) {
  const [answer, setAnswer] = useState<AnswerPayload | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!answer) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitAttempt(question.id, answer);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Einreichen.");
    } finally {
      setSubmitting(false);
    }
  }

  const resultBg = result ? (result.isCorrect ? "#d1fae5" : "#fee2e2") : "#f9fafb";
  const resultColor = result ? (result.isCorrect ? "#065f46" : "#991b1b") : "#111827";

  return (
    <View style={[qStyles.card, { backgroundColor: resultBg }]}>
      <Text style={[qStyles.prompt, { color: resultColor }]}>{question.prompt}</Text>

      {question.type === "TrueFalse" && !result && (
        <View style={qStyles.optionRow}>
          {([true, false] as const).map((val) => {
            const selected = answer && "value" in answer && (answer as { value: boolean }).value === val;
            return (
              <Pressable
                key={String(val)}
                style={[qStyles.pill, selected && qStyles.pillSelected]}
                onPress={() => setAnswer({ value: val })}
              >
                <Text style={[qStyles.pillText, selected && qStyles.pillTextSelected]}>
                  {val ? "Wahr" : "Falsch"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {question.type === "SingleChoice" && question.options && !result && (
        <View style={qStyles.optionList}>
          {question.options.map((opt) => {
            const selected =
              answer && "selectedOptionId" in answer &&
              (answer as { selectedOptionId: string }).selectedOptionId === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[qStyles.optionItem, selected && qStyles.optionSelected]}
                onPress={() => setAnswer({ selectedOptionId: opt.id })}
              >
                <View style={[qStyles.radio, selected && qStyles.radioSelected]} />
                <Text style={qStyles.optionText}>{opt.text}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {question.type === "MultipleChoice" && question.options && !result && (
        <View style={qStyles.optionList}>
          {question.options.map((opt) => {
            const ids: string[] =
              answer && "selectedOptionIds" in answer
                ? (answer as { selectedOptionIds: string[] }).selectedOptionIds
                : [];
            const checked = ids.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={[qStyles.optionItem, checked && qStyles.optionSelected]}
                onPress={() => {
                  const next = checked
                    ? ids.filter((id) => id !== opt.id)
                    : [...ids, opt.id];
                  setAnswer({ selectedOptionIds: next });
                }}
              >
                <View style={[qStyles.checkbox, checked && qStyles.checkboxChecked]}>
                  {checked && <Text style={qStyles.checkmark}>✓</Text>}
                </View>
                <Text style={qStyles.optionText}>{opt.text}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {result && (
        <View style={qStyles.feedback}>
          <Text style={[qStyles.feedbackLabel, { color: resultColor }]}>
            {result.isCorrect ? "Richtig ✓" : "Falsch ✗"} · {result.score} Punkt(e)
          </Text>
          {!!result.explanation && (
            <Text style={qStyles.explanation}>{result.explanation}</Text>
          )}
        </View>
      )}

      {error && <Text style={qStyles.errorText}>{error}</Text>}

      {!result && (
        <Pressable
          style={[qStyles.submitBtn, (!answer || submitting) && qStyles.btnDisabled]}
          onPress={submit}
          disabled={!answer || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={qStyles.submitText}>Antworten</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

// ── TopicScreen ──────────────────────────────────────────────────────────────

export default function TopicScreen({ route }: Props) {
  const { courseId, topicId } = route.params;
  const { course, loading, completedTopics, completing, completeTopic } =
    useCourseDetail(courseId);

  if (loading || !course) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const topic = course.chapters
    .flatMap((c) => c.topics)
    .find((t) => t.id === topicId);

  if (!topic) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Thema nicht gefunden.</Text>
      </View>
    );
  }

  const done = completedTopics.has(topicId);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* examples */}
      {topic.examples.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Beispiele</Text>
          {[...topic.examples]
            .sort((a, b) => a.order - b.order)
            .map((ex) => (
              <View key={ex.id} style={styles.exampleCard}>
                <Text style={styles.exampleTitle}>{ex.title}</Text>
                {ex.contentBlocks.map((block, i) =>
                  block.kind === "code" ? (
                    <ScrollView
                      key={i}
                      horizontal
                      style={styles.codeBlock}
                      showsHorizontalScrollIndicator={false}
                    >
                      <Text style={styles.codeText}>{block.text}</Text>
                    </ScrollView>
                  ) : (
                    <Markdown key={i} style={mdStyles}>
                      {block.text}
                    </Markdown>
                  ),
                )}
              </View>
            ))}
        </View>
      )}

      {/* questions */}
      {topic.questions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Fragen</Text>
          {topic.questions.map((q) => (
            <QuestionItem key={q.id} question={q} />
          ))}
        </View>
      )}

      {/* mark complete */}
      <View style={styles.completeRow}>
        {done ? (
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>✓ Abgeschlossen</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.completeBtn, completing && styles.btnDisabled]}
            onPress={() => completeTopic(topicId)}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.completeBtnText}>Als erledigt markieren</Text>
            )}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

// ── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#dc2626", fontSize: 15 },
  section: { marginBottom: 24 },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  exampleCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "#1e1e2e",
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#cdd6f4",
    lineHeight: 20,
  },
  completeRow: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  completeBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  btnDisabled: { opacity: 0.6 },
  completeBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  doneBadge: {
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneText: { color: "#065f46", fontWeight: "600", fontSize: 15 },
});

const qStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  prompt: { fontSize: 15, fontWeight: "500", marginBottom: 10 },
  optionRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  pillSelected: { borderColor: "#4f46e5", backgroundColor: "#ede9fe" },
  pillText: { fontSize: 14, color: "#374151" },
  pillTextSelected: { color: "#4f46e5", fontWeight: "600" },
  optionList: { gap: 6, marginBottom: 10 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  optionSelected: { borderColor: "#4f46e5", backgroundColor: "#ede9fe" },
  optionText: { fontSize: 14, color: "#374151", flex: 1 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9ca3af",
  },
  radioSelected: { borderColor: "#4f46e5", backgroundColor: "#4f46e5" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { borderColor: "#4f46e5", backgroundColor: "#4f46e5" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  feedback: { marginBottom: 8 },
  feedbackLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  explanation: { fontSize: 13, color: "#6b7280", fontStyle: "italic" },
  errorText: { color: "#dc2626", fontSize: 13, marginBottom: 6 },
  submitBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  submitText: { color: "#fff", fontWeight: "600" },
});

const mdStyles = {
  body: { fontSize: 14, color: "#374151", lineHeight: 22 },
  code_inline: { backgroundColor: "#f3f4f6", fontFamily: "monospace", fontSize: 13 },
  fence: { backgroundColor: "#1e1e2e", borderRadius: 6, padding: 10 },
};
