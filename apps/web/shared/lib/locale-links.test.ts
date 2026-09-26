import test from 'node:test';
import assert from 'node:assert/strict';
import { localeHref } from './locale-links.ts';

const SLUGS = [
  'how-ability-tests-differ-from-knowledge-tests',
  'what-an-online-iq-test-can-tell-you',
  'why-percentage-correct-is-not-a-percentile',
];

test('article links keep the current locale for both locales', () => {
  for (const slug of SLUGS) {
    assert.equal(
      localeHref('lt', `articles/${slug}`),
      `/lt/articles/${slug}/`,
    );
    assert.equal(
      localeHref('en', `articles/${slug}`),
      `/en/articles/${slug}/`,
    );
  }
});

test('public page links keep the current locale and preserve the root', () => {
  assert.equal(localeHref('lt', 'assessment-guide'), '/lt/assessment-guide/');
  assert.equal(localeHref('en', 'understanding-results'), '/en/understanding-results/');
  assert.equal(localeHref('lt', 'articles'), '/lt/articles/');
  assert.equal(localeHref('lt', ''), '/lt/');
  assert.equal(localeHref('en', '/'), '/en/');
});

test('the helper tolerates leading/trailing slashes without doubling them', () => {
  assert.equal(localeHref('lt', '/articles/x/'), '/lt/articles/x/');
});
