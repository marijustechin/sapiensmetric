import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sitemapIndexXml,
  pageSitemapXml,
  articleSitemapXml,
} from './sitemap-xml.ts';
import {
  publicPageSitemapEntries,
  publicArticleSitemapEntries,
} from './sitemap.ts';
import { SITE_ORIGIN } from './site.ts';

const index = sitemapIndexXml();
const pages = pageSitemapXml();
const articles = articleSitemapXml();

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

test('the index is a <sitemapindex> referencing the page and article children', () => {
  assert.match(index, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.deepEqual(locs(index), [
    `${SITE_ORIGIN}/page-sitemap.xml`,
    `${SITE_ORIGIN}/article-sitemap.xml`,
  ]);
  // No page URLs live in the index itself.
  assert.doesNotMatch(index, /<url>/);
});

test('children are <urlset> documents matching the content groups', () => {
  assert.match(pages, /<urlset /);
  assert.match(articles, /<urlset /);
  assert.equal(locs(pages).length, publicPageSitemapEntries().length);
  assert.equal(locs(articles).length, publicArticleSitemapEntries().length);
  assert.equal(locs(pages).length + locs(articles).length, 20);
});

test('combined URL set is canonical HTTPS non-www with trailing slashes and excludes the root redirect', () => {
  const all = [...locs(pages), ...locs(articles)];
  for (const url of all) {
    assert.ok(url.startsWith(`${SITE_ORIGIN}/`), url);
    assert.ok(url.endsWith('/'), url);
    assert.doesNotMatch(url, /^https?:\/\/www\./);
  }
  assert.equal(all.includes(`${SITE_ORIGIN}/`), false);
});

test('no private route appears in any sitemap document', () => {
  for (const xml of [index, pages, articles]) {
    assert.doesNotMatch(xml, /(^|\/)(auth|account|admin|assessment)(\/|")/);
  }
});

test('URL entries carry reciprocal EN/LT xhtml alternates', () => {
  assert.match(pages, /<xhtml:link rel="alternate" hreflang="en" href="https:\/\/sapiensmetric\.eu\/en\/"\/>/);
  assert.match(pages, /<xhtml:link rel="alternate" hreflang="lt" href="https:\/\/sapiensmetric\.eu\/lt\/"\/>/);
  assert.match(articles, /hreflang="en"/);
  assert.match(articles, /hreflang="lt"/);
});

test('lastmod values are content dates, not a build timestamp', () => {
  const lastmods = [...`${pages}${articles}`.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
    (m) => m[1],
  );
  assert.ok(lastmods.length > 0);
  for (const value of lastmods) {
    assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  }
});
