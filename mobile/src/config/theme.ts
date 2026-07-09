/**
 * Zentrales Design-Token-System – „Akademie"-Palette (warme Aubergine/Kupfer).
 * Light- und Dark-Palette + statische Tokens (Spacing, Radius, Typo, Shadow).
 *
 * Werte gespiegelt aus der kanonischen Quelle `design/tokens.json` im Repo-Root.
 * Änderungen dort zuerst vornehmen. Siehe `design/README.md`.
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
  codeKeyword: string;
};

// ─── Light-Palette ───────────────────────────────────────────────────────────
export const lightColors: Palette = {
  primary: '#4A2B57', // Aubergine
  primaryLight: '#6B4478',
  primaryDark: '#37203F',
  primarySurface: '#ECE4EA',

  accent: '#B5794F', // Kupfer (WCAG-sicherer auf hell)
  accentLight: '#C98B62',
  accentSurface: '#F3E7DC',

  success: '#4E7C5D',
  successLight: '#8FBF9C',
  successSurface: '#E5EFE7',

  error: '#C0453C',
  errorLight: '#E88A83',
  errorSurface: '#F7E5E3',

  warning: '#B5794F',
  warningSurface: '#F6ECE1',

  background: '#F4EFF1',
  surface: '#FFFFFF',
  surfaceElevated: '#ECE4EA',
  border: '#DDD2DC',
  borderLight: '#E7DEE6',

  textPrimary: '#2A1F30',
  textSecondary: '#5B4E63',
  textTertiary: '#83718E',
  textInverted: '#FFFFFF',

  chatUserBubble: '#4A2B57',
  chatAiBubble: '#ECE4EA',
  chatUserText: '#FFFFFF',
  chatAiText: '#2A1F30',

  tabActive: '#4A2B57',
  tabInactive: '#83718E',
  tabBackground: '#ECE4EA',

  codeBackground: '#241C2A',
  codeText: '#F0E8F2',
  codeKeyword: '#8A5FA8',
};

// ─── Dark-Palette ────────────────────────────────────────────────────────────
export const darkColors: Palette = {
  primary: '#C98B62', // Kupfer (CTAs)
  primaryLight: '#D9A87E',
  primaryDark: '#A96F49',
  primarySurface: '#332343',

  accent: '#D9A87E', // Highlight/Labels
  accentLight: '#E6C29F',
  accentSurface: '#3A2B44',

  success: '#8FBF9C',
  successLight: '#A9D3B4',
  successSurface: '#2E3F33',

  error: '#E88A83',
  errorLight: '#F2ADA8',
  errorSurface: '#3A2222',

  warning: '#D9A87E',
  warningSurface: '#3A2B22',

  background: '#171118',
  surface: '#201826',
  surfaceElevated: '#251B2E',
  border: '#2E2336',
  borderLight: '#2C2133',

  textPrimary: '#F4EFF3',
  textSecondary: '#BCAFC2',
  textTertiary: '#82738B',
  textInverted: '#1C1210',

  chatUserBubble: '#332343',
  chatAiBubble: '#201826',
  chatUserText: '#F4EFF3',
  chatAiText: '#E6DCE8',

  tabActive: '#D9A87E',
  tabInactive: '#82738B',
  tabBackground: '#201826',

  codeBackground: '#130E15',
  codeText: '#E6DCE8',
  codeKeyword: '#B08BC9',
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

/**
 * Font-Familien – gewichtskodierte Namen, weil RN `fontWeight` mit Custom-Fonts
 * (v.a. Android) unzuverlässig auf die richtige Schnittdatei mappt. Die Namen
 * müssen exakt den Exporten der `@expo-google-fonts/*`-Pakete entsprechen und
 * werden in `App.tsx` via `useFonts` geladen.
 *
 * serif = Source Serif 4 (Headlines) · sans = Instrument Sans (UI/Body) · mono = IBM Plex Mono (Code)
 */
export const FontFamily = {
  serif: 'SourceSerif4_400Regular',
  serifSemibold: 'SourceSerif4_600SemiBold',
  serifBold: 'SourceSerif4_700Bold',

  sans: 'InstrumentSans_400Regular',
  sansMedium: 'InstrumentSans_500Medium',
  sansSemibold: 'InstrumentSans_600SemiBold',
  sansBold: 'InstrumentSans_700Bold',

  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
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
