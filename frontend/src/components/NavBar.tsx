import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../auth";

export default function NavBar() {
  const navigate = useNavigate();
  const user = getUser();

  if (!user) {
    return null;
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/courses" className="text-lg font-bold text-indigo-700">
            DevEdu
          </Link>
          <Link
            to="/courses"
            data-testid="nav-courses"
            className="text-sm text-gray-700 hover:text-indigo-700"
          >
            Kurse
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span
            data-testid="user-displayname"
            className="text-sm font-medium text-gray-800"
          >
            {user.displayName}
          </span>
          <button
            data-testid="nav-logout"
            onClick={handleLogout}
            className="text-sm rounded bg-gray-100 px-3 py-1 hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
