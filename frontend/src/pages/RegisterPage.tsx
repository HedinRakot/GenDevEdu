import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { storeAuth } from "../auth";
import type { Role } from "../types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Learner");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await api.register(email, displayName, password, role);
      storeAuth(auth);
      navigate("/courses");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Registrierung fehlgeschlagen.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Registrieren</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            data-testid="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Anzeigename</label>
          <input
            data-testid="register-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            data-testid="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rolle</label>
          <select
            data-testid="register-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="Learner">Learner</option>
            <option value="Author">Author</option>
          </select>
        </div>
        {error && (
          <p data-testid="register-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          data-testid="register-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Registrieren…" : "Registrieren"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Schon ein Konto?{" "}
        <a href="/login" className="text-indigo-700 hover:underline">
          Anmelden
        </a>
      </p>
    </div>
  );
}
