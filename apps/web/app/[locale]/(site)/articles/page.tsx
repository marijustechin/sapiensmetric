import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '../../../../shared/content/articles';
import { buildMetadataFor } from '../../../../shared/content/seo';
import { UI_STRINGS } from '../../../../shared/content/site';
import { localeHref } from '../../../../shared/lib/locale-links';
import type { AppLocale } from '../../../../shared/lib/locale-navigation';

/**
 * Articles index (T-013 clarification). Lists every public article with its
 * summary and truthful review date; the articles themselves are separate pages.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  return buildMetadataFor(
    {
      path: 'articles',
      title: UI_STRINGS[appLocale].articlesTitle,
      description: UI_STRINGS[appLocale].articlesDescription,
    },
    appLocale,
  );
}

export default async function ArticlesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const strings = UI_STRINGS[appLocale];
  const articles = [...ARTICLES[appLocale]].sort((a, b) =>
    b.updated.localeCompare(a.updated),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {strings.articlesTitle}
        </h1>
        <p className="text-lg text-slate-700">{strings.articlesDescription}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {articles.map((article) => (
          <li
            key={article.slug}
            className="rounded border border-slate-200 bg-white p-4"
          >
            <h2 className="text-lg font-semibold">
              <Link
                href={localeHref(appLocale, `articles/${article.slug}`)}
                className="text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {article.title}
              </Link>
            </h2>
            <p className="mt-1 text-slate-700">{article.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              {strings.updated}:{' '}
              <time dateTime={article.updated}>{article.updated}</time>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
