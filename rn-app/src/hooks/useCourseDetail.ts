import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import type { ChapterQuizResult, ChapterQuizSummary, CourseDetail } from "../types";

export function useCourseDetail(id: string | undefined) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [chapterQuizResults, setChapterQuizResults] = useState<ChapterQuizSummary[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([api.getCourse(id), api.getProgress()])
      .then(([data, progress]) => {
        if (!active) return;
        setCourse(data);
        const courseProgress = progress.find((p) => p.courseId === data.id);
        if (courseProgress) {
          setCompletedTopics(new Set(courseProgress.completedTopicIds));
          setChapterQuizResults(courseProgress.chapterQuizResults);
        }
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

  async function enroll() {
    if (!course) return;
    setEnrolling(true);
    setEnrollMessage(null);
    try {
      await api.enroll(course.id);
      setEnrollMessage("Erfolgreich eingeschrieben.");
    } catch (err) {
      setEnrollMessage(err instanceof ApiError ? err.message : "Einschreiben fehlgeschlagen.");
    } finally {
      setEnrolling(false);
    }
  }

  async function completeTopic(topicId: string) {
    setCompleting(true);
    try {
      await api.completeTopic(topicId);
      setCompletedTopics((prev) => new Set(prev).add(topicId));
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setCompleting(false);
    }
  }

  function onQuizComplete(result: ChapterQuizResult) {
    setChapterQuizResults((prev) => [
      ...prev.filter((r) => r.chapterId !== result.chapterId),
      {
        chapterId: result.chapterId,
        earnedPoints: result.earnedPoints,
        totalPoints: result.totalPoints,
        passingThresholdPct: result.passingThresholdPct,
        passed: result.passed,
      },
    ]);
  }

  return {
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
  };
}
