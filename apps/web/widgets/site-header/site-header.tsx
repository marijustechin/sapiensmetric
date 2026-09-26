'use client';

import Link from 'next/link';
import { usePathname, useRouter } from '../../shared/i18n/navigation';
import { BrandMark } from '../../shared/ui/brand-mark';
import { otherLocale, switchLocaleTarget, type AppLocale } from '../../shared/lib/locale-navigation';
import { localeHref } from '../../shared/lib/locale-links';
import { NAV_ITEMS, NAV_LABELS, UI_STRINGS } from '../../shared/content/site';

/**
 * Public site header (T-013). Public navigation only: no verify/forgot links,
 * no registration CTA, and no account/admin links (those live in the
 * authenticated app area). Uses explicit locale-prefixed hrefs (built from the
 * active locale) so the exported HTML stays in the current locale; the locale
 * switcher keeps the next-intl router for equivalent-route switching.
 */
export function SiteHeader({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const other = otherLocale(locale);
  const strings = UI_STRINGS[locale];
  const nav = NAV_LABELS[locale];

  const onSwitchLocale = () => {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    const target = switchLocaleTarget({
      pathname: pathname ?? '/',
      search,
      targetLocale: other,
    });
    router.replace(target, { locale: other });
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href={localeHref(locale, '')}
          className="flex items-center gap-2"
          aria-label="SapiensMetric"
        >
          <BrandMark className="h-8 w-8" />
          <span className="font-semibold text-slate-900">SapiensMetric</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={localeHref(locale, item.path)}
              className="rounded text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {nav[item.key]}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={onSwitchLocale}
          className="ml-auto rounded border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {strings.switchLocale}
        </button>
      </div>
    </header>
  );
}
