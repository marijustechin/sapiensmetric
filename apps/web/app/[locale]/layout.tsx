import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LocalePreferenceSync } from '../../features/locale-preference/locale-preference-sync';
import { routing } from '../../shared/i18n/routing';
import { BRANDING } from '../../shared/branding/branding';
import { SITE_ORIGIN } from '../../shared/content/site';
import '../globals.css';

/**
 * Root layout for the localized surface. It provides i18n and the locale
 * preference sync only; the public `(site)` and authenticated `(app)` groups
 * render their own shells. It is a root layout (there is no `app/layout.tsx`)
 * so `<html lang>` follows the active locale; `generateStaticParams` enumerates
 * `lt` and `en` at build time (static export, no middleware/proxy).
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: t('title'),
    description: t('description'),
    icons: [{ url: BRANDING.favicon, type: 'image/webp' }],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering and set the locale for server-rendered next-intl
  // APIs (including `Link`), so server components emit locale-correct hrefs
  // without relying on a proxy/middleware.
  setRequestLocale(locale);

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className="bg-slate-50 text-slate-900">
        {/* Entering a locale-prefixed page remembers that locale (D-022). */}
        <LocalePreferenceSync locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
