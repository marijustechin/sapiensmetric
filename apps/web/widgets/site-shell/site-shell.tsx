import type { ReactNode } from 'react';
import { SiteHeader } from '../site-header/site-header';
import { SiteFooter } from '../site-footer/site-footer';
import type { AppLocale } from '../../shared/lib/locale-navigation';

/** Public site shell (widget): header, readable content column, footer. */
export function SiteShell({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SiteHeader locale={locale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <SiteFooter locale={locale} />
    </div>
  );
}
