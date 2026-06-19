/**
 * Design tokens for the Reading Habit Tracker.
 *
 * Tone: calm and "bookish" — not too playful, not too serious. A warm
 * paper-like light theme and a soft, low-contrast dark theme, with a single
 * muted slate-teal accent so the UI never feels gamified.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentMuted: string;
  onAccent: string;
  success: string;
  danger: string;
  track: string;
};

export const lightColors: ThemeColors = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EFEA',
  text: '#1F2933',
  textMuted: '#6B7280',
  border: '#E5E2DB',
  accent: '#4F6D7A',
  accentMuted: '#DDE6EA',
  onAccent: '#FFFFFF',
  success: '#3F8A6E',
  danger: '#B4534B',
  track: '#E8E5DE',
};

export const darkColors: ThemeColors = {
  background: '#14171A',
  surface: '#1E2227',
  surfaceAlt: '#262B31',
  text: '#E8EAED',
  textMuted: '#9AA0A6',
  border: '#2C3137',
  accent: '#7FA6B5',
  accentMuted: '#2A3A41',
  onAccent: '#0F1316',
  success: '#6FB392',
  danger: '#D98079',
  track: '#2A2F35',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: '400' as const },
  stat: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
} as const;

export type ColorSchemeName = 'light' | 'dark';

export type Theme = {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}
