// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'student' | 'instructor' | 'admin';
}

/** Token-Paar vom Identity Server */
export interface TokenPair {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
  /** Unix-Timestamp (Sekunden) des Access-Token-Ablaufs */
  expiresAt: number | null;
}

export interface AuthState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  /** Bootstrapping-Flag – verhindert Login-Flackern beim Start. */
  isLoading: boolean;
  /** Während eines aktiven Login-/Logout-Calls true. */
  isAuthenticating: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Standard-JWT-Claims, die wir aus dem ID-Token lesen. */
export interface IdTokenClaims {
  sub: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  role?: string | string[];
}
