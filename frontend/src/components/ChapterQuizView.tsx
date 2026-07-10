import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import type {
  AnswerPayload,
  ChapterQuizResult,
  ChapterQuizSummary,
  Question,
} from "../types";

interface Props {
  chapterId: string;
  chapterTitle: string;
  questions: Question[];
  previousResult?: ChapterQuizSummary;
  onComplete?: (result: ChapterQuizResult) => void;
}

export default function ChapterQuizView({
  chapterId,
  chapterTitle,
  questions,
  previousResult,
  onComplete,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [result, setResult] = useState<ChapterQuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setSingle(questionId: string, selectedOptionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { selectedOptionId } }));
  }

  function setMulti(questionId: string, optionId: string, checked: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId];
      const existing: string[] =
        current && "selectedOptionIds" in current
          ? current.selectedOptionIds
          : [];
      const next = checked
        ? [...existing, optionId]
        : existing.filter((id) => id !== optionId);
      return { ...prev, [questionId]: { selectedOptionIds: next } };
    });
  }

  function setTrueFalse(questionId: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: { value } }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError("Bitte alle Fragen beantworten.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id],
      }));
      const res = await api.submitChapterQuiz(chapterId, payload);
      setResult(res);
      onComplete?.(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Quiz konnte nicht eingereicht werden.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayResult = result ?? (previousResult ? { ...previousResult, results: [] } : null);
  const scorePercent = displayResult
    ? displayResult.totalPoints > 0
      ? Math.round((displayResult.earnedPoints / displayResult.totalPoints) * 100)
      : 0
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Kapitelquiz: {chapterTitle}</h2>
        {displayResult && (
          <span
            className={`rounded px-3 py-1 text-sm font-medium ${
              displayResult.passed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {displayResult.passed ? "Bestanden" : "Nicht bestanden"}
          </span>
        )}
      </div>

      {displayResult && (
        <div className="rounded border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Ergebnis:{" "}
            <span className="font-semibold">
              {displayResult.earnedPoints} / {displayResult.totalPoints} Punkte
              ({scorePercent}%)
            </span>
            {" · "}Mindestpunktzahl: {displayResult.passingThresholdPct}%
          </p>
          {!result && previousResult && (
            <p className="mt-1 text-xs text-gray-500">
              Letzter Versuch gespeichert. Quiz erneut einreichen, um einen neuen Versuch zu starten.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, idx) => {
          const qResult = result?.results.find((r) => r.questionId === q.id);
          const answered = !!answers[q.id];

          return (
            <div
              key={q.id}
              className={`rounded border p-4 ${
                qResult
                  ? qResult.isCorrect
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="mb-3 font-medium">
                {idx + 1}. {q.prompt}
              </p>

              {q.type === "SingleChoice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`sc-${q.id}`}
                        value={opt.id}
                        checked={
                          !!answers[q.id] &&
                          "selectedOptionId" in answers[q.id] &&
                          (answers[q.id] as { selectedOptionId: string })
                            .selectedOptionId === opt.id
                        }
                        onChange={() => setSingle(q.id, opt.id)}
                        disabled={!!result}
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "MultipleChoice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected =
                      !!answers[q.id] &&
                      "selectedOptionIds" in answers[q.id] &&
                      (
                        answers[q.id] as { selectedOptionIds: string[] }
                      ).selectedOptionIds.includes(opt.id);
                    return (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => setMulti(q.id, opt.id, e.target.checked)}
                          disabled={!!result}
                        />
                        {opt.text}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === "TrueFalse" && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`tf-${q.id}`}
                      checked={
                        !!answers[q.id] &&
                        "value" in answers[q.id] &&
                        (answers[q.id] as { value: boolean }).value === true
                      }
                      onChange={() => setTrueFalse(q.id, true)}
                      disabled={!!result}
                    />
                    Wahr
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`tf-${q.id}`}
                      checked={
                        !!answers[q.id] &&
                        "value" in answers[q.id] &&
                        (answers[q.id] as { value: boolean }).value === false
                      }
                      onChange={() => setTrueFalse(q.id, false)}
                      disabled={!!result}
                    />
                    Falsch
                  </label>
                </div>
              )}

              {qResult && (
                <div className="mt-3 text-sm">
                  <span className={qResult.isCorrect ? "text-emerald-700" : "text-red-700"}>
                    {qResult.isCorrect ? "Richtig" : "Falsch"} · {qResult.score} Punkt(e)
                  </span>
                  {qResult.explanation && (
                    <p className="mt-1 text-gray-600">{qResult.explanation}</p>
                  )}
                </div>
              )}

              {!result && !answered && (
                <p className="mt-2 text-xs text-amber-600">Noch nicht beantwortet</p>
              )}
            </div>
          );
        })}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!result && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Einreichen…" : "Quiz einreichen"}
          </button>
        )}

        {result && (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setAnswers({});
              setError(null);
            }}
            className="rounded border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50"
          >
            Erneut versuchen
          </button>
        )}
      </form>
    </div>
  );
}
