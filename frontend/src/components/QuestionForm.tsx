import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "../api";
import type { CreateQuestionInput, QuestionType } from "../types";

interface Props {
  onSubmit: (input: CreateQuestionInput) => Promise<void>;
  onCancel: () => void;
}

export default function QuestionForm({ onSubmit, onCancel }: Props) {
  const [type, setType] = useState<QuestionType>("TrueFalse");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(1);
  const [difficulty, setDifficulty] = useState("Easy");

  const optCounter = useRef(2);
  const [options, setOptions] = useState([
    { id: "opt_0", text: "" },
    { id: "opt_1", text: "" },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState("opt_0");
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>(["opt_0"]);
  const [correctAnswer, setCorrectAnswer] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addOption() {
    const id = `opt_${optCounter.current++}`;
    setOptions((prev) => [...prev, { id, text: "" }]);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    setCorrectOptionId((prev) => (prev === id ? options[0]?.id ?? "" : prev));
    setCorrectOptionIds((prev) => prev.filter((x) => x !== id));
  }

  function updateOptionText(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function toggleMultiCorrect(id: string, checked: boolean) {
    setCorrectOptionIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const base = { type, prompt: prompt.trim(), explanation: explanation.trim() || undefined, points, difficulty };
      let input: CreateQuestionInput;
      if (type === "TrueFalse") {
        input = { ...base, correctAnswer };
      } else if (type === "SingleChoice") {
        input = { ...base, options, correctOptionId };
      } else {
        input = { ...base, options, correctOptionIds };
      }
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Frage konnte nicht hinzugefügt werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">Typ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="TrueFalse">Wahr / Falsch</option>
            <option value="SingleChoice">Single Choice</option>
            <option value="MultipleChoice">Multiple Choice</option>
          </select>
        </div>
        <div className="w-20">
          <label className="mb-1 block text-xs font-medium text-gray-700">Punkte</label>
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">Schwierigkeit</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="Easy">Leicht</option>
            <option value="Medium">Mittel</option>
            <option value="Hard">Schwer</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Frage (Prompt)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={2}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="Fragestellung…"
        />
      </div>

      {type === "TrueFalse" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Richtige Antwort</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={correctAnswer === true}
                onChange={() => setCorrectAnswer(true)}
              />
              Wahr
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={correctAnswer === false}
                onChange={() => setCorrectAnswer(false)}
              />
              Falsch
            </label>
          </div>
        </div>
      )}

      {(type === "SingleChoice" || type === "MultipleChoice") && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Antwortoptionen {type === "SingleChoice" ? "(eine richtige)" : "(mehrere richtige)"}
          </label>
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              {type === "SingleChoice" ? (
                <input
                  type="radio"
                  name="correct-single"
                  checked={correctOptionId === opt.id}
                  onChange={() => setCorrectOptionId(opt.id)}
                  title="Als richtig markieren"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={correctOptionIds.includes(opt.id)}
                  onChange={(e) => toggleMultiCorrect(opt.id, e.target.checked)}
                  title="Als richtig markieren"
                />
              )}
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOptionText(opt.id, e.target.value)}
                required
                placeholder={`Option ${options.indexOf(opt) + 1}`}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-red-400 hover:text-red-600"
                  title="Entfernen"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-indigo-600 hover:underline"
          >
            + Option hinzufügen
          </button>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Erklärung (optional)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="Wird nach der Beantwortung angezeigt…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Speichern…" : "Frage hinzufügen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
