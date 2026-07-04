/**
 * Zentrale Axios-Instanz für alle authentifizierten API-Aufrufe.
 *
 * Token-Quelle: Clerk verwaltet Access-Token und Refresh-Rotation selbst.
 * AuthContext.tsx registriert über setApiTokenProvider() eine Funktion,
 * die das aktuelle Session-Token von Clerk holt (inkl. automatischem Refresh).
 *
 * Bei 401: Session ist ungültig → Force-Logout-Event → AuthProvider meldet den User ab.
 */
import axios, { AxiosError, AxiosInstance } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { emitForceLogout } from '@/services/authEvents';

// Gesetzt von AuthProvider sobald Clerk bereit ist
let _tokenProvider: (() => Promise<string | null>) | null = null;

export function setApiTokenProvider(fn: () => Promise<string | null>): void {
  _tokenProvider = fn;
}

/**
 * Aktuelles Access-Token (oder null). Für Aufrufe außerhalb von Axios — z. B. der
 * fetch-basierte SSE-Chat-Stream, der den Interceptor nicht durchläuft.
 */
export async function getApiToken(): Promise<string | null> {
  return _tokenProvider ? _tokenProvider() : null;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request-Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  if (_tokenProvider) {
    const token = await _tokenProvider();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response-Interceptor ────────────────────────────────────────────────────
// Clerk refresht Tokens automatisch; ein 401 bedeutet die Session ist wirklich abgelaufen.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      emitForceLogout();
    }
    return Promise.reject(error);
  },
);
