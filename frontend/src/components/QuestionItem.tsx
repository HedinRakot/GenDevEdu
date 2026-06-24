import { useState } from "react";
import { api, ApiError } from "../api";
import type { AnswerPayload, AttemptResult, Question } from "../types";

export default function QuestionItem({ question }: { question: Question }) {
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [tfValue, setTfValue] = useState<boolean | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleMulti(optionId: string) {
    setSelectedMulti((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  }

  function buildAnswer(): AnswerPayload | null {
    switch (question.type) {
      case "SingleChoice":
        return selectedSingle ? { selectedOptionId: selectedSingle } : null;
      case "MultipleChoice":
        return { selectedOptionIds: selectedMulti };
      case "TrueFalse":
        return tfValue === null ? null : { value: tfValue };
      default:
        return null;
    }
  }

  async function handleSubmit() {
    const answer = buildAnswer();
    if (answer === null) {
      setError("Bitte eine Antwort auswählen.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitAttempt(question.id, answer);
      setResult(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Antwort konnte nicht gesendet werden.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      data-testid="question-item"
      className="rounded border border-gray-200 bg-white p-4"
    >
      <p className="mb-3 font-medium">{question.prompt}</p>

      {(question.type === "SingleChoice" ||
        question.type === "MultipleChoice") &&
        question.options && (
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isMulti = question.type === "MultipleChoice";
              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    data-testid="option-input"
                    type={isMulti ? "checkbox" : "radio"}
                    name={`q-${question.id}`}
                    value={opt.id}
                    checked={
                      isMulti
                        ? selectedMulti.includes(opt.id)
                        : selectedSingle === opt.id
                    }
                    onChange={() =>
                      isMulti
                        ? toggleMulti(opt.id)
                        : setSelectedSingle(opt.id)
                    }
                  />
                  <span data-testid="option-label">{opt.text}</span>
                </label>
              );
            })}
          </div>
        )}

      {question.type === "TrueFalse" && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              data-testid="truefalse-true"
              type="radio"
              name={`q-${question.id}`}
              checked={tfValue === true}
              onChange={() => setTfValue(true)}
            />
            <span>Wahr</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              data-testid="truefalse-false"
              type="radio"
              name={`q-${question.id}`}
              checked={tfValue === false}
              onChange={() => setTfValue(false)}
            />
            <span>Falsch</span>
          </label>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        data-testid="submit-answer"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-3 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Senden…" : "Antwort absenden"}
      </button>

      {result && (
        <div
          data-testid="answer-feedback"
          className={`mt-3 rounded p-3 text-sm ${
            result.isCorrect
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">
            {result.isCorrect ? "Richtig!" : "Falsch."}
          </p>
          {result.explanation && (
            <p className="mt-1">{result.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
