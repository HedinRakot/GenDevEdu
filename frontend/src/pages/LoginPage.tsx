import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { storeAuth } from "../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await api.login(email, password);
      storeAuth(auth);
      navigate("/courses");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "E-Mail oder Passwort ist falsch."
            : err.message
          : "Login fehlgeschlagen.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Anmelden</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            data-testid="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            data-testid="password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        {error && (
          <p data-testid="login-error" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          data-testid="login-submit"
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Noch kein Konto?{" "}
        <a href="/register" className="text-indigo-700 hover:underline">
          Registrieren
        </a>
      </p>
    </div>
  );
}
