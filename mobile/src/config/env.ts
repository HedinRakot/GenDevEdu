/**
 * App-weite Konfiguration & API-Keys
 *
 * Clerk-Setup (einmalig):
 *  1. Konto auf https://clerk.com anlegen
 *  2. Neue Application erstellen (Name: "DevEdu")
 *  3. Publishable Key aus dem Clerk Dashboard hier eintragen
 *  4. Im Clerk Dashboard → JWT Templates → neues Template "DevEdu" anlegen:
 *       { "role": "{{user.public_metadata.role}}" }
 *  5. Backend-Konfiguration: Clerk:Authority in appsettings.json setzen
 *     (Format: https://<dein-clerk-slug>.clerk.accounts.dev)
 */

// ─── Clerk Auth ────────────────────────────────────────────────────────────────
/**
 * Clerk Publishable Key – gelesen aus EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (.env.local).
 * Fallback auf den hardcodierten Dev-Key falls die Env-Var nicht gesetzt ist.
 * CLERK_SECRET_KEY gehört NICHT hierher — nur ins Backend (appsettings.json).
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  'pk_test_ZGVzdGluZWQtc3VuZmlzaC0xMy5jbGVyay5hY2NvdW50cy5kZXYk';

// ─── AI / Gemini ────────────────────────────────────────────────────────────
/**
 * Gemini API-Key – gelesen aus EXPO_PUBLIC_GEMINI_API_KEY (.env.local).
 * Leer = Chat-Feature ist deaktiviert (ChatScreen zeigt einen Hinweis).
 */
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

/** Gemini Modell-Name */
export const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Backend API ─────────────────────────────────────────────────────────────
/**
 * Basis-URL der REST API – gelesen aus EXPO_PUBLIC_API_BASE_URL (.env.local).
 * Fallback auf das lokale Backend. Die Endpunkt-Pfade in src/api/courses.ts
 * enthalten bereits das '/api'-Präfix, daher hier OHNE '/api'-Suffix.
 *
 * Lokal (Kind/Podman + `kubectl port-forward svc/backend 8080:8080`): 'http://localhost:8080'
 *   - Android-Emulator stattdessen: 'http://10.0.2.2:8080'
 *   - Echtes Gerät: 'http://<LAN-IP>:8080'
 * Produktion: 'https://developer-education.com/educationapi'
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/** Request-Timeout in Millisekunden */
export const API_TIMEOUT_MS = 10_000;
