import { useState, useEffect } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type EffectiveTheme = 'dark' | 'light';

function getSystemTheme(): EffectiveTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(preference: ThemePreference) {
  const effective: EffectiveTheme = preference === 'system' ? getSystemTheme() : preference;
  if (effective === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

const STORAGE_KEY = 'angelflix-theme';

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return stored ?? 'dark';
  });

  // Apply on mount and whenever preference changes
  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setPreference = (p: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, p);
    setPreferenceState(p);
  };

  const effectiveTheme: EffectiveTheme =
    preference === 'system' ? getSystemTheme() : preference;

  return { preference, effectiveTheme, setPreference };
}
