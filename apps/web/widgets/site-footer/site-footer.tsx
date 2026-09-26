import Link from 'next/link';
import {
  NAV_ITEMS,
  NAV_LABELS,
  PUBLIC_CONTACT_EMAIL,
  UI_STRINGS,
  mailtoHref,
} from '../../shared/content/site';
import { localeHref } from '../../shared/lib/locale-links';
import type { AppLocale } from '../../shared/lib/locale-navigation';

/**
 * Public site footer (T-013). Server component: the locale is passed by the
 * site shell (route param) and hrefs are explicitly locale-prefixed, so the
 * current locale is preserved (see `shared/lib/locale-links.ts`).
 */
export function SiteFooter({ locale }: { locale: AppLocale }) {
  const nav = NAV_LABELS[locale];
  const strings = UI_STRINGS[locale];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:px-6 md:flex-row md:justify-between">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={localeHref(locale, item.path)}
              className="text-slate-700 hover:text-slate-900"
            >
              {nav[item.key]}
            </Link>
          ))}
          <Link href={localeHref(locale, 'contact')} className="text-slate-700 hover:text-slate-900">
            {strings.contact}
          </Link>
          <Link href={localeHref(locale, 'privacy')} className="text-slate-700 hover:text-slate-900">
            {strings.privacy}
          </Link>
          <a
            href={mailtoHref()}
            className="text-slate-700 hover:text-slate-900"
          >
            {PUBLIC_CONTACT_EMAIL}
          </a>
        </nav>
        <p className="max-w-md text-slate-600">{strings.footerIdentity}</p>
      </div>
    </footer>
  );
}
