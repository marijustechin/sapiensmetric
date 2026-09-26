import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentPage } from '../../../../../shared/ui/content-page';
import { ARTICLES, articleSlugs } from '../../../../../shared/content/articles';
import { buildPageMetadata } from '../../../../../shared/content/seo';
import { NAV_LABELS, UI_STRINGS } from '../../../../../shared/content/site';
import Link from 'next/link';
import { localeHref } from '../../../../../shared/lib/locale-links';
import type { AppLocale } from '../../../../../shared/lib/locale-navigation';

/** One static page per article slug; the parent `[locale]` supplies locales. */
export function generateStaticParams() {
  return articleSlugs().map((slug) => ({ slug }));
}

function findArticle(locale: AppLocale, slug: string) {
  return ARTICLES[locale].find((article) => article.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = findArticle(locale as AppLocale, slug);
  if (!article) {
    return { title: 'Article not found' };
  }
  return buildPageMetadata(article, locale as AppLocale);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;
  const article = findArticle(appLocale, slug);
  if (!article) {
    notFound();
  }

  const strings = UI_STRINGS[appLocale];
  const related = ARTICLES[appLocale].filter((item) => item.slug !== article.slug);

  return (
    <ContentPage page={article} locale={appLocale}>
      <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {strings.related}
        </h2>
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            <Link
              href={localeHref(appLocale, 'assessment-guide')}
              className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NAV_LABELS[appLocale].assessmentGuide}
            </Link>
          </li>
          {related.map((item) => (
            <li key={item.slug}>
              <Link
                href={localeHref(appLocale, `articles/${item.slug}`)}
                className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </ContentPage>
  );
}
