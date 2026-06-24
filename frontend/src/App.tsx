import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/courses"
            element={
              <RequireAuth>
                <CoursesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:id"
            element={
              <RequireAuth>
                <CourseDetailPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </main>
    </div>
  );
}
