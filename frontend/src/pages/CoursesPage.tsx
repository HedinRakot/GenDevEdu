import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { getUser, isAuthor } from "../auth";
import type { CourseSummary } from "../types";

export default function CoursesPage() {
  const navigate = useNavigate();
  const user = getUser();
  const author = isAuthor(user);

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Author create-course form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadCourses() {
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
    loadCourses();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createCourse({ title, description });
      await api.publishCourse(created.id);
      setTitle("");
      setDescription("");
      await loadCourses();
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Kurs konnte nicht angelegt werden.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kurse</h1>

      {author && (
        <section className="mb-8 rounded border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Kurs anlegen</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Titel</label>
              <input
                data-testid="create-course-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Beschreibung
              </label>
              <textarea
                data-testid="create-course-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={2}
              />
            </div>
            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}
            <button
              data-testid="create-course-submit"
              type="submit"
              disabled={creating}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? "Anlegen…" : "Kurs anlegen"}
            </button>
          </form>
        </section>
      )}

      {loading && <p>Lade Kurse…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p className="text-gray-600">Keine Kurse vorhanden.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <div
            key={course.id}
            data-testid="course-card"
            onClick={() => navigate(`/courses/${course.id}`)}
            className="cursor-pointer rounded border border-gray-200 bg-white p-4 hover:border-indigo-400 hover:shadow"
          >
            <h3
              data-testid="course-card-title"
              className="text-lg font-semibold text-indigo-700"
            >
              {course.title}
            </h3>
            {course.description && (
              <p className="mt-1 text-sm text-gray-600">{course.description}</p>
            )}
            <div className="mt-2 flex gap-2 text-xs text-gray-500">
              {course.level && (
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {course.level}
                </span>
              )}
              {course.status && (
                <span className="rounded bg-gray-100 px-2 py-0.5">
                  {course.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
