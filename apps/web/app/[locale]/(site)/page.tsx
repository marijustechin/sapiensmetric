import type { Metadata } from 'next';
import Link from 'next/link';
import { localeHref } from '../../../shared/lib/locale-links';
import { ContentPage } from '../../../shared/ui/content-page';
import { ArticleList } from '../../../shared/ui/article-list';
import { PAGES } from '../../../shared/content/pages';
import { buildPageMetadata } from '../../../shared/content/seo';
import { NAV_LABELS, UI_STRINGS } from '../../../shared/content/site';
import type { AppLocale } from '../../../shared/lib/locale-navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(PAGES[locale as AppLocale].home, locale as AppLocale);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as AppLocale;
  const strings = UI_STRINGS[locale];
  const nav = NAV_LABELS[locale];

  return (
    <ContentPage page={PAGES[locale].home} locale={locale}>
      <nav className="flex flex-wrap gap-3">
        <Link
          href={localeHref(locale, 'assessment-guide')}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {nav.assessmentGuide}
        </Link>
        <Link
          href={localeHref(locale, 'understanding-results')}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {nav.understandingResults}
        </Link>
        <Link
          href={localeHref(locale, 'contact')}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {strings.contact}
        </Link>
      </nav>
      <ArticleList locale={locale} />
    </ContentPage>
  );
}
