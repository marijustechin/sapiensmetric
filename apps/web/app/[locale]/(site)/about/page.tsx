import type { Metadata } from 'next';
import { ContentPage } from '../../../../shared/ui/content-page';
import { PAGES } from '../../../../shared/content/pages';
import { buildPageMetadata } from '../../../../shared/content/seo';
import type { AppLocale } from '../../../../shared/lib/locale-navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(PAGES[locale as AppLocale].about, locale as AppLocale);
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  return <ContentPage page={PAGES[appLocale].about} locale={appLocale} />;
}
