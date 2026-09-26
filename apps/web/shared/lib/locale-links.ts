/**
 * Locale-aware href builder for server-rendered public links (T-013 follow-up).
 *
 * With `output: 'export'` and no proxy/middleware, next-intl's server-rendered
 * `Link` falls back to the default locale (English) for the path prefix. Server
 * components therefore build explicit locale-prefixed hrefs with this helper
 * (directory-style, matching `trailingSlash: true`) and use `next/link`. Client
 * components keep using the locale-aware `i18n/navigation` convention.
 */
import type { AppLocale } from './locale-navigation';

/** `localeHref('lt', 'articles/x')` -> `/lt/articles/x/`. */
export function localeHref(locale: AppLocale, path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean.length > 0 ? `/${locale}/${clean}/` : `/${locale}/`;
}
