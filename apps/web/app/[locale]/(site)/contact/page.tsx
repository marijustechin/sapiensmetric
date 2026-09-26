import type { Metadata } from 'next';
import { ContentPage } from '../../../../shared/ui/content-page';
import { PAGES } from '../../../../shared/content/pages';
import { buildPageMetadata } from '../../../../shared/content/seo';
import {
  PUBLIC_CONTACT_EMAIL,
  UI_STRINGS,
  mailtoHref,
} from '../../../../shared/content/site';
import type { AppLocale } from '../../../../shared/lib/locale-navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(PAGES[locale as AppLocale].contact, locale as AppLocale);
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  return (
    <ContentPage page={PAGES[appLocale].contact} locale={appLocale}>
      <p>
        <a
          href={mailtoHref()}
          className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {UI_STRINGS[appLocale].emailUs}: {PUBLIC_CONTACT_EMAIL}
        </a>
      </p>
    </ContentPage>
  );
}
