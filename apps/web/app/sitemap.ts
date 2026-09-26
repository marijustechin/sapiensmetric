import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, publicPagePaths } from '../shared/content/site';

// Required for `output: 'export'` metadata routes.
export const dynamic = 'force-static';
import { PAGES, PAGE_PATHS, type PageKey } from '../shared/content/pages';
import { ARTICLES, articleSlugs } from '../shared/content/articles';
import { LOCALES } from '../shared/lib/locale-navigation';

/**
 * Static sitemap (T-013). Lists only intended indexable public pages/articles
 * under the production origin, with truthful last-modified dates and
 * reciprocal EN/LT alternates. Auth/account/admin routes are excluded (and
 * carry `noindex`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const rawPath of publicPagePaths()) {
      const key = (Object.keys(PAGE_PATHS) as PageKey[]).find(
        (candidate) => PAGE_PATHS[candidate] === rawPath,
      );
      if (!key) continue;
      const page = PAGES[locale][key];
      entries.push({
        url: `${SITE_ORIGIN}/${locale}${rawPath ? `/${rawPath}` : ''}/`,
        lastModified: page.updated,
        changeFrequency: 'monthly',
        priority: rawPath === '' ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((code) => [
              code,
              `${SITE_ORIGIN}/${code}${rawPath ? `/${rawPath}` : ''}/`,
            ]),
          ),
        },
      });
    }

    const articlesUpdated = ARTICLES[locale].reduce(
      (latest, item) => (item.updated > latest ? item.updated : latest),
      ARTICLES[locale][0]?.updated ?? '',
    );
    entries.push({
      url: `${SITE_ORIGIN}/${locale}/articles/`,
      lastModified: articlesUpdated,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((code) => [code, `${SITE_ORIGIN}/${code}/articles/`]),
        ),
      },
    });

    for (const slug of articleSlugs()) {
      const article = ARTICLES[locale].find((item) => item.slug === slug);
      if (!article) continue;
      entries.push({
        url: `${SITE_ORIGIN}/${locale}/articles/${slug}/`,
        lastModified: article.updated,
        changeFrequency: 'yearly',
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((code) => [
              code,
              `${SITE_ORIGIN}/${code}/articles/${slug}/`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
