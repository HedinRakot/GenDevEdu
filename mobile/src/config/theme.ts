/**
 * Zentrales Design-Token-System
 * Light- und Dark-Palette + statische Tokens (Spacing, Radius, Typo, Shadow).
 */

// ─── Palette-Typ ─────────────────────────────────────────────────────────────
export type Palette = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySurface: string;

  accent: string;
  accentLight: string;
  accentSurface: string;

  success: string;
  successLight: string;
  successSurface: string;

  error: string;
  errorLight: string;
  errorSurface: string;

  warning: string;
  warningSurface: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverted: string;

  chatUserBubble: string;
  chatAiBubble: string;
  chatUserText: string;
  chatAiText: string;

  tabActive: string;
  tabInactive: string;
  tabBackground: string;

  codeBackground: string;
  codeText: string;
};

// ─── Light-Palette ───────────────────────────────────────────────────────────
export const lightColors: Palette = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primarySurface: '#EEF2FF',

  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentSurface: '#FFFBEB',

  success: '#10B981',
  successLight: '#6EE7B7',
  successSurface: '#ECFDF5',

  error: '#EF4444',
  errorLight: '#FCA5A5',
  errorSurface: '#FEF2F2',

  warning: '#F97316',
  warningSurface: '#FFF7ED',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverted: '#FFFFFF',

  chatUserBubble: '#6366F1',
  chatAiBubble: '#F1F5F9',
  chatUserText: '#FFFFFF',
  chatAiText: '#0F172A',

  tabActive: '#6366F1',
  tabInactive: '#94A3B8',
  tabBackground: '#FFFFFF',

  codeBackground: '#0F172A',
  codeText: '#E2E8F0',
};

// ─── Dark-Palette ────────────────────────────────────────────────────────────
export const darkColors: Palette = {
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  primarySurface: '#1E1B4B',

  accent: '#FBBF24',
  accentLight: '#FDE68A',
  accentSurface: '#3B2F0B',

  success: '#34D399',
  successLight: '#6EE7B7',
  successSurface: '#064E3B',

  error: '#F87171',
  errorLight: '#FCA5A5',
  errorSurface: '#450A0A',

  warning: '#FB923C',
  warningSurface: '#431407',

  background: '#0B1220',
  surface: '#0F172A',
  surfaceElevated: '#1E293B',
  border: '#1F2A3D',
  borderLight: '#1E293B',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',
  textInverted: '#0F172A',

  chatUserBubble: '#6366F1',
  chatAiBubble: '#1E293B',
  chatUserText: '#FFFFFF',
  chatAiText: '#F1F5F9',

  tabActive: '#A5B4FC',
  tabInactive: '#64748B',
  tabBackground: '#0F172A',

  codeBackground: '#020617',
  codeText: '#E2E8F0',
};

/**
 * @deprecated Statische Light-Farben für Komponenten, die noch nicht
 * auf den dynamischen Theme-Hook umgestellt wurden. Nutze stattdessen
 * `useTheme()` aus `@/context/ThemeContext`, um Dark-Mode-Support
 * automatisch zu erhalten.
 */
export const Colors = lightColors;

// ─── Spacing (8-pt-Grid) ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border-Radien ───────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// ─── Typografie ──────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ─── Schatten (Cross-Platform) ───────────────────────────────────────────────
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Transitions / Animationen ───────────────────────────────────────────────
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
