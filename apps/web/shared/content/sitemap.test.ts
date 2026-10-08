import test from 'node:test';
import assert from 'node:assert/strict';
import { publicSitemapEntries } from './sitemap.ts';
import { SITE_ORIGIN, publicPagePaths } from './site.ts';
import { PAGES, PAGE_PATHS, type PageKey } from './pages.ts';
import { ARTICLES, articleSlugs } from './articles.ts';
import { LOCALES } from '../lib/locale-navigation.ts';

/**
 * Reproducible public sitemap (T-020). The URL set is derived from repository
 * content, so these tests assert the composition, the exclusions, the canonical
 * URL shape, reciprocal alternates, and truthful `lastmod` values — not just a
 * brittle count.
 */

const entries = publicSitemapEntries();
const urls = entries.map((entry) => entry.url);

test('sitemap is generated from content (no fixed ceiling) at the approved size', () => {
  const expected =
    LOCALES.length * (publicPagePaths().length + 1 + articleSlugs().length);
  assert.equal(entries.length, expected);
  // Current approved public set (owner policy, T-020).
  assert.equal(entries.length, 20);
});

test('sitemap includes both locale homes and excludes the root redirect', () => {
  assert.ok(urls.includes(`${SITE_ORIGIN}/en/`));
  assert.ok(urls.includes(`${SITE_ORIGIN}/lt/`));
  assert.equal(urls.includes(`${SITE_ORIGIN}/`), false);
});

test('sitemap excludes auth/account/admin/assessment', () => {
  for (const url of urls) {
    assert.doesNotMatch(url, /(^|\/)(auth|account|admin|assessment)(\/|$)/);
  }
});

test('sitemap contains every public page and article slug per locale', () => {
  for (const locale of LOCALES) {
    for (const rawPath of publicPagePaths()) {
      const suffix = rawPath ? `/${rawPath}` : '';
      assert.ok(
        urls.includes(`${SITE_ORIGIN}/${locale}${suffix}/`),
        `missing ${locale} page ${rawPath || '<home>'}`,
      );
    }
    assert.ok(urls.includes(`${SITE_ORIGIN}/${locale}/articles/`));
    for (const slug of articleSlugs()) {
      assert.ok(urls.includes(`${SITE_ORIGIN}/${locale}/articles/${slug}/`));
    }
  }
});

test('every URL is canonical HTTPS non-www with a trailing slash', () => {
  for (const url of urls) {
    assert.ok(url.startsWith(`${SITE_ORIGIN}/`), url);
    assert.ok(url.endsWith('/'), url);
    assert.doesNotMatch(url, /^https?:\/\/www\./);
  }
});

test('entries carry reciprocal EN/LT alternates with trailing slashes', () => {
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.alternates).sort(), ['en', 'lt']);
    for (const code of LOCALES) {
      assert.ok(entry.alternates[code].startsWith(`${SITE_ORIGIN}/${code}/`));
      assert.ok(entry.alternates[code].endsWith('/'));
    }
    const own = entry.url.startsWith(`${SITE_ORIGIN}/en/`) ? 'en' : 'lt';
    assert.equal(entry.alternates[own], entry.url);
  }
});

test('lastModified is the content review date, not build time', () => {
  const contentDates = new Set<string>();
  for (const locale of LOCALES) {
    for (const key of Object.keys(PAGE_PATHS) as PageKey[]) {
      contentDates.add(PAGES[locale][key].updated);
    }
    for (const article of ARTICLES[locale]) {
      contentDates.add(article.updated);
    }
  }
  // A build-time `lastmod` would not be a content review date and fail here.
  for (const entry of entries) {
    assert.ok(
      contentDates.has(entry.lastModified),
      `unexpected lastModified: ${entry.lastModified}`,
    );
  }
});
