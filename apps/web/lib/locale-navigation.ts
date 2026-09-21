/**
 * Dependency-free locale/path helpers shared by the UI and unit tests.
 *
 * `next-intl` is the UI i18n layer (see `i18n/`). These helpers cover the pure,
 * testable parts of locale handling that do not need a React/Next runtime:
 * locale validation, same-route language switching, and safe `returnTo`
 * remapping for the language switcher.
 *
 * The security boundary for arbitrary query input remains `sanitizeReturnTo`
 * in `auth-navigation.ts`; the helpers here only ever produce same-origin
 * absolute paths.
 */

export const LOCALES = ['lt', 'en'] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'lt';

/** True only for the supported UI locales (`lt`, `en`). */
export function isLocale(value: unknown): value is AppLocale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  );
}

/** The other supported locale. */
export function otherLocale(locale: AppLocale): AppLocale {
  return locale === 'lt' ? 'en' : 'lt';
}

function isSafePath(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return false;
  }
  if (trimmed.includes('\\')) {
    return false;
  }
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return false;
  }
  return true;
}

/**
 * Return an absolute path with its locale prefix normalised to `targetLocale`.
 *
 * Accepts a same-origin absolute path, with or without an existing
 * `/{locale}` prefix, and preserves any query string and fragment. Returns
 * `null` for anything that is not a safe same-origin path.
 */
export function localizePath(
  path: unknown,
  targetLocale: AppLocale,
  locales: readonly AppLocale[] = LOCALES,
): string | null {
  if (!isSafePath(path)) {
    return null;
  }

  const value = path.trim();
  let split = value.length;
  const queryIndex = value.indexOf('?');
  const hashIndex = value.indexOf('#');
  if (queryIndex !== -1) {
    split = Math.min(split, queryIndex);
  }
  if (hashIndex !== -1) {
    split = Math.min(split, hashIndex);
  }

  const pathname = value.slice(0, split);
  const suffix = value.slice(split);
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  if (
    segments.length > 0 &&
    (locales as readonly string[]).includes(segments[0])
  ) {
    segments.shift();
  }

  const rest = segments.length > 0 ? `/${segments.join('/')}` : '';
  return `/${targetLocale}${rest}${suffix}`;
}

export interface SwitchLocaleInput {
  /** Locale-less path from next-intl's `usePathname` (e.g. `/auth/login`). */
  pathname: string;
  /** Raw query string, with or without a leading `?`. */
  search?: string;
  targetLocale: AppLocale;
  locales?: readonly AppLocale[];
}

/**
 * Build the locale-less target (path + query) for the language switcher.
 *
 * A `returnTo` query parameter is remapped to the target locale when it is a
 * safe same-origin path; otherwise it is dropped. All other query parameters
 * are preserved. The caller passes the result to the locale-aware router,
 * which adds the target locale prefix.
 */
export function switchLocaleTarget(input: SwitchLocaleInput): string {
  const locales = input.locales ?? LOCALES;
  const rawSearch = (input.search ?? '').replace(/^\?/, '');
  const params = new URLSearchParams(rawSearch);
  const returnTo = params.get('returnTo');
  if (returnTo !== null) {
    const localized = localizePath(returnTo, input.targetLocale, locales);
    if (localized === null) {
      params.delete('returnTo');
    } else {
      params.set('returnTo', localized);
    }
  }

  const pathname = input.pathname.startsWith('/')
    ? input.pathname
    : `/${input.pathname}`;
  const search = params.toString();
  return search.length > 0 ? `${pathname}?${search}` : pathname;
}
