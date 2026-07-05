import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Globale Navigations-Referenz — erlaubt Zugriff auf die aktuelle Route
 * außerhalb von Screen-Komponenten (F14: Heartbeat-Kontext).
 */
export const navigationRef = createNavigationContainerRef();
