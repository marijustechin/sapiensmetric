/**
 * Pure navigation helpers for the auth frontend.
 *
 * `sanitizeReturnTo` is the security boundary for post-login redirects: it only
 * accepts same-origin absolute paths and falls back otherwise, so an
 * attacker-supplied `returnTo` can never redirect to an external URL.
 */

import type { Locale } from './auth-types';

const DEFAULT_FALLBACK = '/';

/**
 * Return a safe, same-origin path derived from `value`, or `fallback`.
 *
 * Rejected (fall back): non-strings, empty strings, relative paths that do not
 * start with `/`, protocol-relative `//host`, backslashes, control characters,
 * and anything whose resolved origin differs from `origin`.
 */
export function sanitizeReturnTo(
  value: unknown,
  origin: string,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }
  if (trimmed.includes('\\')) {
    return fallback;
  }
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }
  try {
    const url = new URL(trimmed, origin);
    if (url.origin !== origin) {
      return fallback;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export function loginHref(locale: Locale, returnTo?: string): string {
  const base = `/${locale}/auth/login`;
  if (!returnTo) {
    return base;
  }
  return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * Guarantee a locale prefix on a same-origin path (T-023 acceptance correction:
 * "Lithuanian after re-authentication"). If `path` already targets any supported
 * locale it is returned unchanged; otherwise the active locale is prefixed, so a
 * locale-less `returnTo` can never silently fall back to the default locale after
 * sign-in or re-authentication.
 */
export function ensureLocalePrefix(
  path: string,
  locale: Locale,
  locales: readonly string[] = ['lt', 'en'],
): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  for (const code of locales) {
    if (withSlash === `/${code}` || withSlash.startsWith(`/${code}/`)) {
      return withSlash;
    }
  }
  return `/${locale}${withSlash}`;
}
