import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

/**
 * Locale-aware navigation helpers.
 *
 * `Link`/`useRouter` add the active locale prefix automatically, so route
 * components reference locale-less hrefs (e.g. `/auth/login`). `usePathname`
 * returns the pathname without the locale prefix, which the language switcher
 * uses to build the equivalent route in the other locale.
 */
export const {Link, usePathname, useRouter, getPathname} =
  createNavigation(routing);
