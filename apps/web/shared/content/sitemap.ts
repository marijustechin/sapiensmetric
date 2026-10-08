/**
 * Public sitemap entries (T-013, made reproducible by T-020).
 *
 * The URL set is derived entirely from repository content:
 * - every published public page path for every locale (including the locale
 *   homes `/en/`, `/lt/`);
 * - the articles index and every article slug.
 *
 * It deliberately EXCLUDES the root remembered-language redirect, auth/account/
 * admin/assessment and any other nonpublic route. There is no fixed URL ceiling:
 * adding a page or article grows the sitemap automatically. `lastModified` is the
 * content's own review date (never the build time), and every entry carries
 * reciprocal EN/LT alternates. All URLs are canonical HTTPS non-www with trailing
 * slashes.
 */
import { SITE_ORIGIN, publicPagePaths } from './site.ts';
import { PAGES, PAGE_PATHS, type PageKey } from './pages.ts';
import { ARTICLES, articleSlugs } from './articles.ts';
import { LOCALES } from '../lib/locale-navigation.ts';

export interface PublicSitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'monthly' | 'yearly';
  priority: number;
  alternates: Record<string, string>;
}

function localizedUrl(origin: string, locale: string, path: string): string {
  return `${origin}/${locale}${path ? `/${path}` : ''}/`;
}

function alternatesFor(origin: string, path: string): Record<string, string> {
  return Object.fromEntries(
    LOCALES.map((code) => [code, localizedUrl(origin, code, path)]),
  );
}

export function publicSitemapEntries(
  origin: string = SITE_ORIGIN,
): PublicSitemapEntry[] {
  const entries: PublicSitemapEntry[] = [];

  for (const locale of LOCALES) {
    // Public pages, including the locale home (rawPath === '').
    for (const rawPath of publicPagePaths()) {
      const key = (Object.keys(PAGE_PATHS) as PageKey[]).find(
        (candidate) => PAGE_PATHS[candidate] === rawPath,
      );
      if (!key) continue;
      const page = PAGES[locale][key];
      entries.push({
        url: localizedUrl(origin, locale, rawPath),
        lastModified: page.updated,
        changeFrequency: 'monthly',
        priority: rawPath === '' ? 1 : 0.7,
        alternates: alternatesFor(origin, rawPath),
      });
    }

    // Articles index.
    const articlesUpdated = ARTICLES[locale].reduce(
      (latest, item) => (item.updated > latest ? item.updated : latest),
      ARTICLES[locale][0]?.updated ?? '',
    );
    entries.push({
      url: localizedUrl(origin, locale, 'articles'),
      lastModified: articlesUpdated,
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: alternatesFor(origin, 'articles'),
    });

    // Every article.
    for (const slug of articleSlugs()) {
      const article = ARTICLES[locale].find((item) => item.slug === slug);
      if (!article) continue;
      entries.push({
        url: localizedUrl(origin, locale, `articles/${slug}`),
        lastModified: article.updated,
        changeFrequency: 'yearly',
        priority: 0.6,
        alternates: alternatesFor(origin, `articles/${slug}`),
      });
    }
  }

  return entries;
}
