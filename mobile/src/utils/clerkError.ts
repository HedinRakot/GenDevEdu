import type { TFunction } from 'i18next';

import i18n from '@/i18n';

/**
 * Übersetzt einen Clerk-Fehler in eine lokalisierte Meldung. Clerk liefert
 * `message`/`longMessage` nur auf Englisch — deshalb bilden wir stattdessen den
 * stabilen Fehler-`code` (z. B. `form_password_incorrect`) auf `auth.errors.<code>`
 * ab. Unbekannte Codes fallen auf die generische, lokalisierte Meldung zurück.
 */
export function clerkErrorMessage(error: unknown, t: TFunction, fallbackKey: string): string {
  const e = error as { code?: string; errors?: { code?: string }[] } | null | undefined;
  const code = e?.code ?? e?.errors?.[0]?.code;
  if (code && i18n.exists(`auth.errors.${code}`)) return t(`auth.errors.${code}`);
  return t(fallbackKey);
}
