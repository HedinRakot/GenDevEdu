import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { getUser, isAuthor } from "../auth";
import { useCourseList } from "../hooks/useCourseList";

export default function CoursesPage() {
  const navigate = useNavigate();
  const user = getUser();
  const author = isAuthor(user);
  const { courses, loading, error, createCourse } = useCourseList();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createCourse({ title, description, level: level || undefined });
      setTitle("");
      setDescription("");
      setLevel("");
      navigate(`/courses/${created.id}/edit`);
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
              <label className="mb-1 block text-sm font-medium">Titel</label>
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
              <label className="mb-1 block text-sm font-medium">Beschreibung</label>
              <textarea
                data-testid="create-course-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Level</label>
              <select
                data-testid="create-course-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2"
              >
                <option value="">-- Bitte wählen --</option>
                <option value="Anfänger">Anfänger</option>
                <option value="Fortgeschrittener">Fortgeschrittener</option>
                <option value="Profi">Profi</option>
              </select>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
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
                <span className="rounded bg-gray-100 px-2 py-0.5">{course.level}</span>
              )}
              {course.status && (
                <span className="rounded bg-gray-100 px-2 py-0.5">{course.status}</span>
              )}
              {author && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${course.id}/edit`);
                  }}
                  className="ml-auto rounded bg-indigo-50 px-2 py-0.5 text-indigo-700 hover:bg-indigo-100"
                >
                  Bearbeiten
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
