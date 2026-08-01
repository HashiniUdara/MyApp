import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

export const THEME_STORAGE_KEY = 'myapp_theme_mode';
export const THEME_MODES = {
  dark: 'dark',
  light: 'light',
};

export const THEME_PALETTES = {
  dark: {
    mode: THEME_MODES.dark,
    background: '#091D3C',
    surface: '#215B80',
    surfaceAlt: '#17496A',
    surfaceSoft: '#12325A',
    border: '#2DA49E',
    primary: '#2DA49E',
    primarySoft: '#2A746F',
    secondary: '#E7A6CA',
    accent: '#ECC657',
    success: '#4CD97B',       // Fix 4: lighter green — was #446949 (too dark on dark bg)
    successSoft: '#0d3320',   // Fix 4: adjusted soft background
    danger: '#E7A6CA',
    dangerSoft: '#5B2B56',
    warning: '#ECC657',
    operatorBg: '#1e4a6a',    // Fix 1: operator button bg (dark mode)
    textPrimary: '#FEFEFE',
    textSecondary: '#D8EDF2',
    mutedText: '#9BC0AA',
    placeholder: 'rgba(254,254,254,0.35)',
    textOnPrimary: '#091D3C',
    textOnDanger: '#091D3C',
    backdrop: 'rgba(9,29,60,0.72)',
    shadow: '#091D3C',
  },
  light: {
    mode: THEME_MODES.light,
    background: '#FEFEFE',
    surface: '#FDF0CD',
    surfaceAlt: '#D8EDF2',
    surfaceSoft: '#E7D2F5',
    border: '#9BC0AA',
    primary: '#9BC0AA',
    primarySoft: '#D8EDF2',
    secondary: '#F6CDBC',
    accent: '#CFCFF9',
    success: '#446949',
    successSoft: '#D8EDF2',
    danger: '#B75E83',
    dangerSoft: '#E7D2F5',
    warning: '#D8A935',
    operatorBg: '#446949',    // Fix 1: operator button bg in light = #446949 (not #E7A6CA)
    textPrimary: '#091D3C',
    textSecondary: '#215B80',
    mutedText: '#446949',
    placeholder: 'rgba(9,29,60,0.35)',
    textOnPrimary: '#091D3C',
    textOnDanger: '#FEFEFE',
    backdrop: 'rgba(9,29,60,0.28)',
    shadow: '#9BC0AA',
  },
};

let activeMode = THEME_MODES.dark;
let activeColors = THEME_PALETTES.dark;

export const getThemeMode = () => activeMode;
export const getThemeColors = () => activeColors;

function setActiveTheme(mode) {
  activeMode = mode === THEME_MODES.light ? THEME_MODES.light : THEME_MODES.dark;
  activeColors = THEME_PALETTES[activeMode];
}

export const ThemeContext = createContext({
  mode: THEME_MODES.dark,
  colors: THEME_PALETTES.dark,
  isDark: true,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(THEME_MODES.dark);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!mounted) return;
        if (storedMode === THEME_MODES.light || storedMode === THEME_MODES.dark) {
          setActiveTheme(storedMode);
          setMode(storedMode);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const setThemeMode = useCallback(async (nextMode) => {
    const safeMode = nextMode === THEME_MODES.light ? THEME_MODES.light : THEME_MODES.dark;
    setActiveTheme(safeMode);
    setMode(safeMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, safeMode);
    } catch (_) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode === THEME_MODES.dark ? THEME_MODES.light : THEME_MODES.dark);
  }, [mode, setThemeMode]);

  const value = useMemo(() => ({
    mode,
    colors: THEME_PALETTES[mode],
    isDark: mode === THEME_MODES.dark,
    setThemeMode,
    toggleTheme,
  }), [mode, setThemeMode, toggleTheme]);

  setActiveTheme(mode);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function themeColor(name) {
  return getThemeColors()[name];
}

export function createThemedStyleSheet(factory) {
  const cache = {};
  const getStyles = () => {
    const mode = getThemeMode();
    if (!cache[mode]) cache[mode] = StyleSheet.create(factory(THEME_PALETTES[mode]));
    return cache[mode];
  };

  return new Proxy({}, {
    get(_target, prop) {
      return getStyles()[prop];
    },
    ownKeys() {
      return Reflect.ownKeys(getStyles());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(getStyles(), prop);
    },
  });
}
