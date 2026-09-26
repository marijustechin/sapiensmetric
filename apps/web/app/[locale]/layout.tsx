import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '../../features/auth/auth-provider';
import { LocalePreferenceSync } from '../../features/locale-preference/locale-preference-sync';
import { AppShell } from '../../widgets/app-shell/app-shell';
import { routing } from '../../shared/i18n/routing';
import { BRANDING } from '../../shared/branding/branding';
import '../globals.css';

/**
 * Root layout for the localized surface.
 *
 * It is a root layout (there is no `app/layout.tsx`) so `<html lang>` matches
 * the active locale. `generateStaticParams` enumerates `lt` and `en` at build
 * time; the static export therefore emits every locale route with no
 * middleware/proxy and is refresh-safe on static hosting.
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
    title: t('title'),
    description: t('description'),
    // Supplied favicon asset, registered from its stable public path.
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

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body>
        {/* Entering a locale-prefixed page remembers that locale (D-022). */}
        <LocalePreferenceSync locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
