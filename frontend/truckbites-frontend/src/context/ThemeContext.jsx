import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'tb-theme';
const MODES = ['light', 'dark', 'system'];
const LIGHT_COLOR = '#FCF8F4';
const DARK_COLOR = '#1F1814';

function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (MODES.includes(stored)) return stored;
  } catch { /* ignore */ }
  // New visitors default to light; Dark / System are explicit choices.
  return 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getInitialMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Track the OS preference so "system" mode can update live while the site is open
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // What's actually applied to <html> — 'system' resolves against the OS preference
  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  // Apply the resolved theme to <html> and keep the browser chrome in sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolvedTheme === 'dark' ? DARK_COLOR : LIGHT_COLOR);
  }, [resolvedTheme]);

  // Persist only the user's mode choice (light/dark/system), not OS-driven changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch { /* ignore */ }
  }, [mode]);

  const changeMode = useCallback((next) => {
    if (MODES.includes(next)) setModeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode: changeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
