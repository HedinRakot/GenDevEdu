import { useWindowDimensions } from 'react-native';

/** Breakpoint (px), ab dem die Desktop-/Web-Sidebar statt der Bottom-Tab-Bar greift. */
export const WIDE_BREAKPOINT = 900;

export interface Responsive {
  width: number;
  height: number;
  /** Breite Ansicht → Sidebar-Navigation (Desktop/Web/Tablet-Landscape). */
  isWide: boolean;
  /** Schmale Ansicht → Bottom-Tab-Bar (Phone). */
  isPhone: boolean;
}

/**
 * Reagiert live auf Fenster-Resize (wichtig für react-native-web) und entscheidet
 * zwischen Sidebar- und Bottom-Tab-Navigation.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  return { width, height, isWide, isPhone: !isWide };
}
