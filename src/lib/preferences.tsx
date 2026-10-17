'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  defaultPreferences,
  formatDate,
  formatMoney,
  parsePreferences,
  PREFERENCES_KEY,
  translate,
  type Locale,
  type Preferences,
  type Theme,
} from './i18n';
const Context = createContext({
  ...defaultPreferences,
  setLocale: (_locale: Locale) => {
    void _locale;
  },
  setTheme: (_theme: Theme) => {
    void _theme;
  },
  storageError: false,
  ready: false,
});
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { setTheme: applyTheme } = useTheme();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [storageError, setStorageError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function load() {
      try {
        setPreferences(parsePreferences(localStorage.getItem(PREFERENCES_KEY)));
      } catch {
        setStorageError(true);
      }
      setReady(true);
    }
    // Synchronize the external browser preference store after hydration.
    load();
    const sync = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY || event.key === null) load();
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = preferences.locale;
    document.documentElement.dataset.theme = preferences.theme;
    applyTheme(preferences.theme);
  }, [preferences, ready, applyTheme]);
  function update(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  return (
    <Context.Provider
      value={{
        ...preferences,
        storageError,
        ready,
        setLocale: (locale) => update({ locale }),
        setTheme: (theme) => update({ theme }),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePreferences() {
  const context = useContext(Context);
  return {
    ...context,
    tr: (text: string, params?: Record<string, string | number>) =>
      translate(text, context.locale, params),
    money: (cents: number) => formatMoney(cents, context.locale),
    dateTime: (iso: string) => formatDate(iso, context.locale),
    number: (value: number) => new Intl.NumberFormat(context.locale).format(value),
  };
}
