import { Platform } from 'react-native';

/**
 * Verwaltung (Autoren-/Admin-/Anwesenheitsbereich) ist bewusst nur im
 * Web-Build zugänglich — die native App bleibt eine reine Lern-App.
 * Die Backend-Policies (AuthorOrAdmin/AdminOnly) schützen die API unabhängig davon.
 */
export const isManagementPlatform = Platform.OS === 'web';

/**
 * Scroll-Indikator nur im Web anzeigen. Auf iOS/Android sind Overlay-Indikatoren
 * unerwünscht; im Web fehlt ohne dies eine sichtbare Scrollbar (react-native-web
 * setzt bei `false` `scrollbar-width: none`), was Nutzer als "keine Scrollbar" sehen.
 */
export const showScrollIndicator = Platform.OS === 'web';
