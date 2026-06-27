import { Texte, Language } from '@/types/course';
import i18n from '@/i18n';

/**
 * Wandelt den i18next Sprach-Code in das API Language-Enum um.
 * de -> 1 (German)
 * en -> 2 (English)
 * ru -> 0 (Russian)
 */
export const getApiLanguage = (): Language => {
  const lng = i18n.language;
  if (lng.startsWith('ru')) return Language.Russian;
  if (lng.startsWith('en')) return Language.English;
  return Language.German; // Default
};

/**
 * Extrahiert den Text in der aktuellen Sprache aus einem Texte-Objekt.
 * @param texte Das Texte-Modell aus der API
 * @returns Der lokalisierte String
 */
export const translate = (texte: Texte | null | undefined): string => {
  if (!texte || !texte.items || texte.items.length === 0) return '';
  
  const currentLang = getApiLanguage();
  const item = texte.items.find((i) => i.language === currentLang);
  
  // Fallback: Wenn die aktuelle Sprache nicht im Set ist, nimm Deutsch (1) oder das erste Element
  if (!item) {
    const fallback = texte.items.find((i) => i.language === Language.German);
    return fallback ? fallback.text : texte.items[0].text;
  }
  
  return item.text;
};
