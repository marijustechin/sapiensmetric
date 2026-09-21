import {defineRouting} from 'next-intl/routing';
import {DEFAULT_LOCALE, LOCALES} from '../lib/locale-navigation';

/**
 * next-intl routing configuration.
 *
 * The supported UI locales are exactly `lt` and `en`, always exposed as an
 * explicit path prefix (`/lt/...`, `/en/...`). This is a static-export app, so
 * no middleware/proxy is used; routing resolves through the `app/[locale]`
 * segment and `generateStaticParams`.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});
