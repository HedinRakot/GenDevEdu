import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import ExampleView from "../components/ExampleView";
import QuestionItem from "../components/QuestionItem";
import type { CourseDetail, Topic } from "../types";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const [completedTopics, setCompletedTopics] = useState<Set<string>>(
    new Set(),
  );
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getCourse(id)
      .then((data) => {
        if (!active) return;
        setCourse(data);
        const firstTopic = data.chapters
          .flatMap((c) => c.topics)
          .sort((a, b) => a.order - b.order)[0];
        setSelectedTopicId(firstTopic ? firstTopic.id : null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Fehler beim Laden.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const topics: Topic[] = useMemo(() => {
    if (!course) return [];
    return course.chapters
      .flatMap((c) => c.topics)
      .sort((a, b) => a.order - b.order);
  }, [course]);

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId) ?? null,
    [topics, selectedTopicId],
  );

  async function handleEnroll() {
    if (!course) return;
    setEnrolling(true);
    setEnrollMessage(null);
    try {
      await api.enroll(course.id);
      setEnrollMessage("Erfolgreich eingeschrieben.");
    } catch (err) {
      setEnrollMessage(
        err instanceof ApiError ? err.message : "Einschreiben fehlgeschlagen.",
      );
    } finally {
      setEnrolling(false);
    }
  }

  async function handleMarkComplete() {
    if (!selectedTopic) return;
    setCompleting(true);
    try {
      await api.completeTopic(selectedTopic.id);
      setCompletedTopics((prev) => new Set(prev).add(selectedTopic.id));
    } catch {
      /* leave badge unset on failure */
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <p>Lade Kurs…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!course) return <p>Kurs nicht gefunden.</p>;

  const topicCompleted = selectedTopic
    ? completedTopics.has(selectedTopic.id)
    : false;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {course.description && (
            <p className="mt-1 text-gray-600">{course.description}</p>
          )}
        </div>
        <button
          data-testid="enroll-button"
          onClick={handleEnroll}
          disabled={enrolling}
          className="shrink-0 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {enrolling ? "Einschreiben…" : "Einschreiben"}
        </button>
      </div>
      {enrollMessage && (
        <p className="mb-4 text-sm text-gray-700">{enrollMessage}</p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Themen
          </h2>
          {topics.length === 0 && (
            <p className="text-sm text-gray-500">Keine Themen.</p>
          )}
          {topics.map((topic) => (
            <button
              key={topic.id}
              data-testid="topic-nav-item"
              onClick={() => setSelectedTopicId(topic.id)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                topic.id === selectedTopicId
                  ? "bg-indigo-100 font-medium text-indigo-800"
                  : "hover:bg-gray-100"
              }`}
            >
              {topic.title}
              {completedTopics.has(topic.id) && (
                <span className="ml-1 text-emerald-600">✓</span>
              )}
            </button>
          ))}
        </aside>

        <section>
          {!selectedTopic && (
            <p className="text-gray-500">Bitte ein Thema auswählen.</p>
          )}
          {selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  {selectedTopic.title}
                </h2>
                <div className="flex items-center gap-3">
                  {topicCompleted && (
                    <span
                      data-testid="topic-completed"
                      className="rounded bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                    >
                      Abgeschlossen
                    </span>
                  )}
                  <button
                    data-testid="mark-complete"
                    onClick={handleMarkComplete}
                    disabled={completing || topicCompleted}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {completing ? "Speichern…" : "Als erledigt markieren"}
                  </button>
                </div>
              </div>

              {selectedTopic.examples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Beispiele</h3>
                  {[...selectedTopic.examples]
                    .sort((a, b) => a.order - b.order)
                    .map((ex) => (
                      <ExampleView key={ex.id} example={ex} />
                    ))}
                </div>
              )}

              {selectedTopic.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fragen</h3>
                  {selectedTopic.questions.map((q) => (
                    <QuestionItem key={q.id} question={q} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
