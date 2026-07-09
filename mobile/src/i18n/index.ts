import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

// ─── Ressourcen ───────────────────────────────────────────────────────────────
export const resources = {
  de: { translation: de },
  en: { translation: en },
  ru: { translation: ru },
} as const;

export type SupportedLanguage = keyof typeof resources;

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; nativeName: string }[] = [
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
];

// ─── Initialisierung ──────────────────────────────────────────────────────────
// Initialisierung erfolgt synchron mit Default-Sprache.
// In App.tsx wird die gespeicherte Sprache nachträglich geladen.
i18n.use(initReactI18next).init({
  resources,
  lng: 'de', // Deutsch als Standard
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false, // React Native escaped bereits
  },
  compatibilityJSON: 'v4',
});

export default i18n;
