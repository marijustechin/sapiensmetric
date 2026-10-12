/**
 * Sitemap XML builders (T-023).
 *
 * Produces a Yoast-style structure for this static site:
 *   /sitemap.xml          → <sitemapindex> referencing the children
 *   /page-sitemap.xml     → <urlset> of public pages (+ the articles index)
 *   /article-sitemap.xml  → <urlset> of articles
 *
 * Everything is derived from `publicSitemapEntries()` (repository content): the
 * canonical HTTPS non-www URL set, truthful content `lastmod` values and
 * reciprocal EN/LT `xhtml:link` alternates. Private routes and the root
 * remembered-language redirect are never included.
 */

import {
  publicArticleSitemapEntries,
  publicPageSitemapEntries,
  type PublicSitemapEntry,
} from './sitemap.ts';
import { SITE_ORIGIN } from './site.ts';

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';

/** Minimal XML text escaping for URLs and dates. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function maxLastModified(entries: PublicSitemapEntry[]): string {
  return entries.reduce(
    (latest, entry) => (entry.lastModified > latest ? entry.lastModified : latest),
    '',
  );
}

export const SITEMAP_INDEX_PATH = '/sitemap.xml';
export const SITEMAP_PAGE_PATH = '/page-sitemap.xml';
export const SITEMAP_ARTICLE_PATH = '/article-sitemap.xml';

function urlElement(entry: PublicSitemapEntry): string {
  const alternates = Object.keys(entry.alternates)
    .sort()
    .map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${esc(entry.alternates[lang])}"/>`,
    )
    .join('\n');
  return [
    '  <url>',
    `    <loc>${esc(entry.url)}</loc>`,
    `    <lastmod>${esc(entry.lastModified)}</lastmod>`,
    `    <changefreq>${entry.changeFrequency}</changefreq>`,
    `    <priority>${entry.priority.toFixed(1)}</priority>`,
    alternates,
    '  </url>',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

export function urlsetXml(entries: PublicSitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_NS}" xmlns:xhtml="${XHTML_NS}">`,
    entries.map(urlElement).join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Sitemap index. Each child's `lastmod` is the newest content date it contains,
 * so the index stays truthful without a build-time timestamp.
 */
export function sitemapIndexXml(origin: string = SITE_ORIGIN): string {
  const children: { path: string; entries: PublicSitemapEntry[] }[] = [
    { path: SITEMAP_PAGE_PATH, entries: publicPageSitemapEntries(origin) },
    { path: SITEMAP_ARTICLE_PATH, entries: publicArticleSitemapEntries(origin) },
  ];
  const sitemaps = children
    .map(({ path, entries }) =>
      [
        '  <sitemap>',
        `    <loc>${esc(`${origin}${path}`)}</loc>`,
        `    <lastmod>${esc(maxLastModified(entries))}</lastmod>`,
        '  </sitemap>',
      ].join('\n'),
    )
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sitemapindex xmlns="${SITEMAP_NS}">`,
    sitemaps,
    '</sitemapindex>',
    '',
  ].join('\n');
}

export function pageSitemapXml(origin: string = SITE_ORIGIN): string {
  return urlsetXml(publicPageSitemapEntries(origin));
}

export function articleSitemapXml(origin: string = SITE_ORIGIN): string {
  return urlsetXml(publicArticleSitemapEntries(origin));
}
