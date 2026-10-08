'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from '../../shared/i18n/navigation';
import { BrandMark } from '../../shared/ui/brand-mark';
import { Drawer } from '../../shared/ui/drawer';
import { otherLocale, switchLocaleTarget, type AppLocale } from '../../shared/lib/locale-navigation';
import { localeHref } from '../../shared/lib/locale-links';
import { NAV_ITEMS, NAV_LABELS, UI_STRINGS } from '../../shared/content/site';

/** True when a locale-less pathname is the given public nav path. */
function isCurrentPath(pathname: string, path: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (path === '') return normalized === '/';
  return normalized === `/${path}`;
}

/**
 * Public site header (T-013; hamburger navigation added by T-020).
 *
 * Public navigation only: the drawer lists published public destinations (the
 * authenticated app keeps its own role-aware nav). The logo links to the current
 * locale home, the language switch preserves the equivalent route, and the menu
 * button controls the shared modal `Drawer`. Uses explicit locale-prefixed hrefs
 * so the exported HTML stays in the current locale.
 */
export function SiteHeader({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href={localeHref(locale, '')}
          className="flex min-w-0 items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <BrandMark className="h-8 w-8 shrink-0" alt="" />
          <span className="truncate font-semibold text-slate-900">SapiensMetric</span>
        </Link>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSwitchLocale}
            className="inline-flex min-h-[44px] items-center rounded border border-slate-300 px-3 text-sm text-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {strings.switchLocale}
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls="site-menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-slate-300 text-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="sr-only">{strings.openMenu}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={closeMenu}
        label={strings.menu}
        inertTargetId="site-root"
        triggerRef={menuButtonRef}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <span className="text-base font-semibold text-slate-900">
            {strings.menu}
          </span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={strings.closeMenu}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav
          id="site-menu"
          aria-label={strings.primaryNav}
          className="flex flex-col gap-1 p-2"
        >
          {NAV_ITEMS.map((item) => {
            const current = isCurrentPath(pathname ?? '/', item.path);
            return (
              <Link
                key={item.key}
                href={localeHref(locale, item.path)}
                onClick={closeMenu}
                aria-current={current ? 'page' : undefined}
                className={`flex min-h-[44px] items-center rounded px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  current
                    ? 'bg-slate-100 font-semibold text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {nav[item.key]}
              </Link>
            );
          })}
        </nav>
      </Drawer>
    </header>
  );
}
