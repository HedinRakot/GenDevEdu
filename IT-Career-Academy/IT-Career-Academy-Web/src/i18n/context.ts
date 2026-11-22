import { createContext, useContext } from 'react';
import type { Language, Messages } from './translations';

export interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Messages;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
