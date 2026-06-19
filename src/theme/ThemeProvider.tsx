import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildTheme, ColorSchemeName, Theme } from './tokens';

/**
 * Theme preference the user can pick in Settings. "system" follows the OS.
 */
export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_pref';

type ThemeContextValue = {
  theme: Theme;
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveScheme(pref: ThemePref, system: ColorSchemeName): ColorSchemeName {
  return pref === 'system' ? system : pref;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  // Load persisted preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPrefState(value);
      }
    });
  }, []);

  // Track OS appearance changes so "system" mode stays in sync live.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(pref, systemScheme);
    return { theme: buildTheme(scheme), pref, setPref };
  }, [pref, systemScheme, setPref]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx.theme;
}

export function useThemePref(): { pref: ThemePref; setPref: (pref: ThemePref) => void } {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePref must be used within a ThemeProvider');
  return { pref: ctx.pref, setPref: ctx.setPref };
}
