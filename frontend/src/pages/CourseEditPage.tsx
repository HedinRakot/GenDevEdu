import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionForm from "../components/QuestionForm";
import { api, ApiError } from "../api";
import type { ContentBlock, CourseDetail, CreateQuestionInput } from "../types";

type FormKey =
  | "chapter"
  | `topic-${string}`
  | `example-${string}`
  | `topicQuestion-${string}`
  | `chapterQuestion-${string}`;

// ── inline form components ───────────────────────────────────────────────────

function ChapterForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim(), description.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Kapiteltitel"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Beschreibung (optional)"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Kapitel hinzufügen"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function TopicForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Thematitel"
        className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
        autoFocus
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "…" : "Hinzufügen"}
      </button>
      <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
        Abbrechen
      </button>
    </form>
  );
}

function ExampleForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string, blocks: ContentBlock[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([{ kind: "markdown", text: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addBlock(kind: "markdown" | "code") {
    setBlocks((prev) => [...prev, { kind, text: "", language: kind === "code" ? "csharp" : undefined }]);
  }

  function updateBlock(idx: number, partial: Partial<ContentBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...partial } : b)));
  }

  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title.trim(), blocks.filter((b) => b.text.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Beispieltitel"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
      />

      {blocks.map((block, idx) => (
        <div key={idx} className="space-y-1 rounded border border-gray-200 bg-white p-2">
          <div className="flex items-center gap-2">
            <select
              value={block.kind}
              onChange={(e) => updateBlock(idx, { kind: e.target.value as "markdown" | "code" })}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              <option value="markdown">Markdown</option>
              <option value="code">Code</option>
            </select>
            {block.kind === "code" && (
              <input
                type="text"
                value={block.language ?? ""}
                onChange={(e) => updateBlock(idx, { language: e.target.value })}
                placeholder="Sprache (z.B. csharp)"
                className="rounded border border-gray-300 px-2 py-1 text-xs w-32"
              />
            )}
            <span className="ml-auto text-xs text-gray-400">Block {idx + 1}</span>
            {blocks.length > 1 && (
              <button
                type="button"
                onClick={() => removeBlock(idx)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
          <textarea
            value={block.text}
            onChange={(e) => updateBlock(idx, { text: e.target.value })}
            rows={3}
            placeholder={block.kind === "code" ? "Code hier eingeben…" : "Markdown-Text hier eingeben…"}
            className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs"
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button type="button" onClick={() => addBlock("markdown")} className="text-xs text-indigo-600 hover:underline">
          + Markdown-Block
        </button>
        <button type="button" onClick={() => addBlock("code")} className="text-xs text-indigo-600 hover:underline">
          + Code-Block
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Speichern…" : "Beispiel hinzufügen"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

// ── main page ────────────────────────────────────────────────────────────────

export default function CourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [openForm, setOpenForm] = useState<FormKey | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCourse(id);
      setCourse(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handlePublish() {
    if (!id) return;
    setPublishing(true);
    try {
      await api.publishCourse(id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setPublishing(false);
    }
  }

  function closeForm() {
    setOpenForm(null);
  }

  async function handleAddChapter(title: string, description: string) {
    if (!id) return;
    await api.addChapter(id, { title, description });
    closeForm();
    await load();
  }

  async function handleAddTopic(chapterId: string, title: string) {
    await api.addTopic(chapterId, { title });
    closeForm();
    await load();
  }

  async function handleAddExample(topicId: string, title: string, blocks: ContentBlock[]) {
    await api.addExample(topicId, { title, contentBlocks: blocks });
    closeForm();
    await load();
  }

  async function handleAddTopicQuestion(topicId: string, input: CreateQuestionInput) {
    await api.addTopicQuestion(topicId, input);
    closeForm();
    await load();
  }

  async function handleAddChapterQuestion(chapterId: string, input: CreateQuestionInput) {
    await api.addChapterQuestion(chapterId, input);
    closeForm();
    await load();
  }

  if (loading) return <p>Lade Kurs…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!course) return <p>Kurs nicht gefunden.</p>;

  const isDraft = course.status === "Draft";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/courses")}
            className="mb-1 text-sm text-indigo-600 hover:underline"
          >
            ← Alle Kurse
          </button>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="mt-1 text-gray-600">{course.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              isDraft
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isDraft ? "Entwurf" : "Veröffentlicht"}
          </span>
          {isDraft && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {publishing ? "Veröffentlichen…" : "Veröffentlichen"}
            </button>
          )}
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Vorschau
          </button>
        </div>
      </div>

      {/* course structure */}
      <div className="space-y-4">
        {course.chapters.length === 0 && (
          <p className="text-sm text-gray-500">Noch keine Kapitel. Füge das erste Kapitel hinzu.</p>
        )}

        {course.chapters
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((chapter) => (
            <div key={chapter.id} className="rounded border border-gray-200 bg-white">
              {/* chapter header */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                <div>
                  <span className="font-semibold">{chapter.title}</span>
                  {chapter.description && (
                    <span className="ml-2 text-sm text-gray-500">{chapter.description}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setOpenForm(openForm === `topic-${chapter.id}` ? null : `topic-${chapter.id}`)
                    }
                    className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
                  >
                    + Thema
                  </button>
                  <button
                    onClick={() =>
                      setOpenForm(
                        openForm === `chapterQuestion-${chapter.id}`
                          ? null
                          : `chapterQuestion-${chapter.id}`,
                      )
                    }
                    className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
                  >
                    + Kapitelquiz-Frage
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* add topic form */}
                {openForm === `topic-${chapter.id}` && (
                  <TopicForm
                    onSubmit={(title) => handleAddTopic(chapter.id, title)}
                    onCancel={closeForm}
                  />
                )}

                {/* topics */}
                {chapter.topics.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Keine Themen.</p>
                )}
                {chapter.topics
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((topic) => (
                    <div key={topic.id} className="rounded border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-sm">{topic.title}</span>
                          <span className="ml-2 text-xs text-gray-400">
                            {topic.examples.length} Beispiel(e) · {topic.questions.length} Frage(n)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setOpenForm(
                                openForm === `example-${topic.id}` ? null : `example-${topic.id}`,
                              )
                            }
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            + Beispiel
                          </button>
                          <button
                            onClick={() =>
                              setOpenForm(
                                openForm === `topicQuestion-${topic.id}`
                                  ? null
                                  : `topicQuestion-${topic.id}`,
                              )
                            }
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            + Frage
                          </button>
                        </div>
                      </div>

                      {openForm === `example-${topic.id}` && (
                        <ExampleForm
                          onSubmit={(title, blocks) => handleAddExample(topic.id, title, blocks)}
                          onCancel={closeForm}
                        />
                      )}

                      {openForm === `topicQuestion-${topic.id}` && (
                        <div className="mt-2">
                          <QuestionForm
                            onSubmit={(input) => handleAddTopicQuestion(topic.id, input)}
                            onCancel={closeForm}
                          />
                        </div>
                      )}

                      {/* example list */}
                      {topic.examples.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {[...topic.examples]
                            .sort((a, b) => a.order - b.order)
                            .map((ex) => (
                              <li key={ex.id} className="text-xs text-gray-600">
                                📄 {ex.title} ({ex.contentBlocks.length} Block(e))
                              </li>
                            ))}
                        </ul>
                      )}

                      {/* question list */}
                      {topic.questions.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {topic.questions.map((q) => (
                            <li key={q.id} className="text-xs text-gray-600">
                              ❓ {q.type} · {q.points} Pt · {q.prompt.slice(0, 60)}
                              {q.prompt.length > 60 ? "…" : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                {/* chapter quiz questions */}
                {chapter.questions.length > 0 && (
                  <div className="rounded border border-amber-100 bg-amber-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-amber-800">
                      Kapitelquiz ({chapter.questions.length} Frage(n))
                    </p>
                    <ul className="space-y-1">
                      {chapter.questions.map((q) => (
                        <li key={q.id} className="text-xs text-gray-600">
                          ❓ {q.type} · {q.points} Pt · {q.prompt.slice(0, 60)}
                          {q.prompt.length > 60 ? "…" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* add chapter question form */}
                {openForm === `chapterQuestion-${chapter.id}` && (
                  <QuestionForm
                    onSubmit={(input) => handleAddChapterQuestion(chapter.id, input)}
                    onCancel={closeForm}
                  />
                )}
              </div>
            </div>
          ))}

        {/* add chapter */}
        <div>
          <button
            onClick={() => setOpenForm(openForm === "chapter" ? null : "chapter")}
            className="rounded border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
          >
            {openForm === "chapter" ? "▲ Abbrechen" : "+ Kapitel hinzufügen"}
          </button>
          {openForm === "chapter" && (
            <ChapterForm onSubmit={handleAddChapter} onCancel={closeForm} />
          )}
        </div>
      </div>
    </div>
  );
}
