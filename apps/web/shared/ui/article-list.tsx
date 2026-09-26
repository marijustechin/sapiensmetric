import Link from 'next/link';
import { ARTICLES } from '../content/articles';
import { UI_STRINGS } from '../content/site';
import { localeHref } from '../lib/locale-links';
import type { AppLocale } from '../lib/locale-navigation';

/** Lists the public articles for a locale, preserving the current locale. */
export function ArticleList({ locale }: { locale: AppLocale }) {
  const strings = UI_STRINGS[locale];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-slate-900">{strings.articles}</h2>
      <ul className="flex flex-col gap-3">
        {ARTICLES[locale].map((article) => (
          <li key={article.slug} className="rounded border border-slate-200 bg-white p-4">
            <Link
              href={localeHref(locale, `articles/${article.slug}`)}
              className="font-medium text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {article.title}
            </Link>
            <p className="mt-1 text-sm text-slate-600">{article.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
