/**
 * Local language preference and root-route resolution.
 *
 * Client-only, non-sensitive preference stored in browser **localStorage** —
 * never cookies, server state, SSR, middleware, or tracking.
 *
 * The root route `/` resolves to a locale target from the stored preference:
 * a stored `lt` -> `/lt/`, a stored `en` -> `/en/`, and no (or an unsupported)
 * stored value -> `/en/`, the default locale. Whenever a locale-prefixed page
 * is entered the active locale is persisted, so a direct visit to `/lt/` counts
 * as selecting Lithuanian.
 *
 * This module intentionally has **no imports** so it runs under the
 * dependency-free Node test runner; `locale-preference.test.ts` asserts
 * consistency with `LOCALES`/`DEFAULT_LOCALE`.
 */

export const LOCALE_PREFERENCE_KEY = 'sapiensmetric.locale';

export const LOCALE_TARGETS = {
  lt: '/lt/',
  en: '/en/',
} as const;

export type RememberedLocale = keyof typeof LOCALE_TARGETS;

export function isRememberedLocale(value: unknown): value is RememberedLocale {
  return value === 'lt' || value === 'en';
}

/** Minimal storage surface so the logic can be unit-tested without a DOM. */
export interface LocalePreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Read the stored preference, or `null` when absent/unavailable. */
export function readLocalePreference(
  storage: LocalePreferenceStorage | null | undefined,
): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(LOCALE_PREFERENCE_KEY);
  } catch {
    return null;
  }
}

/** Persist a supported locale; ignore unsupported values and storage errors. */
export function persistLocalePreference(
  storage: LocalePreferenceStorage | null | undefined,
  locale: unknown,
): void {
  if (!storage || !isRememberedLocale(locale)) {
    return;
  }
  try {
    storage.setItem(LOCALE_PREFERENCE_KEY, locale);
  } catch {
    // Storage unavailable (e.g. blocked); the preference is simply not saved.
  }
}

/** Resolve the root `/` target from a stored preference value. */
export function resolveRootTarget(stored: unknown): string {
  return isRememberedLocale(stored) ? LOCALE_TARGETS[stored] : LOCALE_TARGETS.en;
}

/** Resolve the root `/` target directly from a storage object. */
export function resolveRootTargetFromStorage(
  storage: LocalePreferenceStorage | null | undefined,
): string {
  return resolveRootTarget(readLocalePreference(storage));
}
