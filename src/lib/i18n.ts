import { en } from './messages.en';
export type Locale = 'pt-BR' | 'en-US';
export type Theme = 'light' | 'dark';
export type Preferences = { locale: Locale; theme: Theme };
export const PREFERENCES_KEY = 'patio.preferences.v1';
export const defaultPreferences: Preferences = { locale: 'pt-BR', theme: 'light' };
export function parsePreferences(raw: string | null): Preferences {
  try {
    const data = JSON.parse(raw ?? '{}');
    return {
      locale: data?.locale === 'en-US' ? 'en-US' : 'pt-BR',
      theme: data?.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return defaultPreferences;
  }
}
const patterns = Object.entries(en)
  .filter(([key]) => /\{\d+\}/.test(key))
  .map(([key, value]) => {
    const keys: string[] = [];
    const pattern = key
      .split(/(\{\d+\})/)
      .map((part) => {
        if (/^\{\d+\}$/.test(part)) {
          keys.push(part.slice(1, -1));
          return '(.+?)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    return { expression: new RegExp(`^${pattern}$`), keys, value };
  });
/** Exact source keys and explicit templates; never changes persisted business data. */
export function translate(
  source: string,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  const text = source.trim();
  let result = locale === 'en-US' ? (en[text] ?? text) : text;
  if (locale === 'en-US' && !en[text] && !params) {
    // Existing P0 events are stored as Portuguese sentences. Keep them intact in storage.
    for (const pattern of patterns) {
      const match = pattern.expression.exec(text);
      if (match) {
        result = pattern.value.replace(/\{(\d+)\}/g, (_, key) =>
          translate(match[pattern.keys.indexOf(key) + 1], locale),
        );
        break;
      }
    }
  }
  if (params) result = result.replace(/\{(\d+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
  if (locale === 'en-US')
    result = result.replace(/R\$\s*([\d.]+),(\d{2})(?![\d.])/g, (_, units, decimals) =>
      formatMoney(Number(units.replaceAll('.', '')) * 100 + Number(decimals), locale),
    );
  return (
    source.slice(0, source.indexOf(text)) +
    result +
    source.slice(source.indexOf(text) + text.length)
  );
}
export function formatMoney(cents: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}
