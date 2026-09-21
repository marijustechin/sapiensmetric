import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

/**
 * next-intl request configuration.
 *
 * The active locale is resolved from the explicit locale passed by the
 * `[locale]` layout/pages (and by `getTranslations({locale})`), so the static
 * build never needs request headers, cookies, or a proxy/middleware. An
 * unrecognised locale falls back to the default; the layout itself rejects
 * anything outside the supported set with `notFound()`.
 */
export default getRequestConfig(async ({locale}) => {
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  };
});
