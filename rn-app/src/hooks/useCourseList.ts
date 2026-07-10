import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import type { CourseSummary } from "../types";

export function useCourseList() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { courses, loading, error, reload: load };
}
