import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthResponse, User } from "./types";

const TOKEN_KEY = "devedu.token";
const REFRESH_KEY = "devedu.refreshToken";
const USER_KEY = "devedu.user";

// In-memory cache — populated once on app start via loadAuth().
// Keeps getToken() / clearAuth() synchronous so api.ts works identically to web.
let _token: string | null = null;
let _user: User | null = null;

/** Call once during app startup to hydrate from AsyncStorage. */
export async function loadAuth(): Promise<void> {
  const [token, userRaw] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  _token = token[1] ?? null;
  try {
    _user = userRaw[1] ? (JSON.parse(userRaw[1]) as User) : null;
  } catch {
    _user = null;
  }
}

export function storeAuth(auth: AuthResponse): void {
  _token = auth.token;
  _user = auth.user;
  // Fire-and-forget — in-memory state is already updated.
  AsyncStorage.multiSet([
    [TOKEN_KEY, auth.token],
    [REFRESH_KEY, auth.refreshToken ?? ""],
    [USER_KEY, JSON.stringify(auth.user)],
  ]).catch(() => {});
}

export function getToken(): string | null {
  return _token;
}

export function getUser(): User | null {
  return _user;
}

export function clearAuth(): void {
  _token = null;
  _user = null;
  AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]).catch(() => {});
}

export function isAuthenticated(): boolean {
  return !!_token;
}

export function isAuthor(user: User | null): boolean {
  return !!user && user.roles.includes("Author");
}
