import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ChapterQuizView from "../components/ChapterQuizView";
import ExampleView from "../components/ExampleView";
import QuestionItem from "../components/QuestionItem";
import { useCourseDetail } from "../hooks/useCourseDetail";
import type { Topic } from "../types";

type ActiveView =
  | { kind: "topic"; topicId: string }
  | { kind: "chapterQuiz"; chapterId: string };

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    course,
    loading,
    error,
    completedTopics,
    chapterQuizResults,
    enrolling,
    enrollMessage,
    completing,
    enroll,
    completeTopic,
    onQuizComplete,
  } = useCourseDetail(id);

  const [activeView, setActiveView] = useState<ActiveView | null>(null);
  const initializedIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!course || initializedIdRef.current === id) return;
    initializedIdRef.current = id;
    const firstTopic = course.chapters
      .flatMap((c) => c.topics)
      .sort((a, b) => a.order - b.order)[0];
    setActiveView(firstTopic ? { kind: "topic", topicId: firstTopic.id } : null);
  }, [course, id]);

  const topics: Topic[] = useMemo(() => {
    if (!course) return [];
    return course.chapters.flatMap((c) => c.topics).sort((a, b) => a.order - b.order);
  }, [course]);

  const selectedTopic = useMemo(() => {
    if (!activeView || activeView.kind !== "topic") return null;
    return topics.find((t) => t.id === activeView.topicId) ?? null;
  }, [topics, activeView]);

  if (loading) return <p>Lade Kurs…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!course) return <p>Kurs nicht gefunden.</p>;

  const topicCompleted = selectedTopic ? completedTopics.has(selectedTopic.id) : false;
  const activeChapterQuizId =
    activeView?.kind === "chapterQuiz" ? activeView.chapterId : null;
  const activeChapter = activeChapterQuizId
    ? (course.chapters.find((c) => c.id === activeChapterQuizId) ?? null)
    : null;

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
          onClick={enroll}
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
        <aside className="space-y-3">
          {course.chapters.length === 0 && (
            <p className="text-sm text-gray-500">Keine Kapitel.</p>
          )}
          {course.chapters
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((chapter) => (
              <div key={chapter.id}>
                <p className="mb-1 px-1 text-xs font-semibold uppercase text-gray-400">
                  {chapter.title}
                </p>
                {chapter.topics
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((topic) => (
                    <button
                      key={topic.id}
                      data-testid="topic-nav-item"
                      onClick={() => setActiveView({ kind: "topic", topicId: topic.id })}
                      className={`block w-full rounded px-3 py-2 text-left text-sm ${
                        activeView?.kind === "topic" && activeView.topicId === topic.id
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
                {chapter.questions.length > 0 && (
                  <button
                    data-testid="chapter-quiz-nav-item"
                    onClick={() =>
                      setActiveView({ kind: "chapterQuiz", chapterId: chapter.id })
                    }
                    className={`mt-1 block w-full rounded px-3 py-2 text-left text-sm ${
                      activeView?.kind === "chapterQuiz" &&
                      activeView.chapterId === chapter.id
                        ? "bg-indigo-100 font-medium text-indigo-800"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    Kapitelquiz
                    {chapterQuizResults.find((r) => r.chapterId === chapter.id)?.passed && (
                      <span className="ml-1 text-emerald-600">✓</span>
                    )}
                  </button>
                )}
              </div>
            ))}
        </aside>

        <section>
          {!activeView && <p className="text-gray-500">Bitte ein Thema auswählen.</p>}

          {activeView?.kind === "chapterQuiz" && activeChapter && (
            <ChapterQuizView
              chapterId={activeChapter.id}
              chapterTitle={activeChapter.title}
              questions={activeChapter.questions}
              previousResult={chapterQuizResults.find(
                (r) => r.chapterId === activeChapter.id,
              )}
              onComplete={onQuizComplete}
            />
          )}

          {activeView?.kind === "topic" && selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{selectedTopic.title}</h2>
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
                    onClick={() => completeTopic(selectedTopic.id)}
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
