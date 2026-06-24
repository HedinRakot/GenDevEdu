import type { AuthResponse, User } from "./types";

const TOKEN_KEY = "devedu.token";
const REFRESH_KEY = "devedu.refreshToken";
const USER_KEY = "devedu.user";

export function storeAuth(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.token);
  if (auth.refreshToken) {
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAuthor(user: User | null): boolean {
  return !!user && user.roles.includes("Author");
}
