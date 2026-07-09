import { Platform } from 'react-native';

/**
 * Verwaltung (Autoren-/Admin-/Anwesenheitsbereich) ist bewusst nur im
 * Web-Build zugänglich — die native App bleibt eine reine Lern-App.
 * Die Backend-Policies (AuthorOrAdmin/AdminOnly) schützen die API unabhängig davon.
 */
export const isManagementPlatform = Platform.OS === 'web';
