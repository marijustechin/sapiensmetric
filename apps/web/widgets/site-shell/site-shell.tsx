import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header/site-header';
import { SiteFooter } from '../site-footer/site-footer';
import { ConsentBanner } from '../../features/analytics/consent-banner';
import { UI_STRINGS } from '../../shared/content/site';
import type { AppLocale } from '../../shared/lib/locale-navigation';

/**
 * Public site shell (widget): skip link, header, readable content column, footer
 * and consent banner. The wrapper carries `id="site-root"` so the modal drawer
 * can mark the page content `inert` while it is open.
 */
export function SiteShell({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const strings = UI_STRINGS[locale];

  return (
    <div
      id="site-root"
      className="flex min-h-screen flex-col bg-slate-50 text-slate-900"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-slate-900 focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        {strings.skipToContent}
      </a>
      <SiteHeader locale={locale} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 focus:outline-none sm:px-6"
      >
        {children}
      </main>
      <SiteFooter locale={locale} />
      <ConsentBanner />
    </div>
  );
}
