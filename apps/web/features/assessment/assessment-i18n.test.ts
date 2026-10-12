import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Regression for the T-022 browser-review finding: `Assessment.refresh` was
 * MISSING_MESSAGE. This scans the real assessment/nav sources for fixed
 * `t('key')` usages and asserts every key exists in BOTH locale catalogues, so a
 * missing translation fails the build rather than surfacing at runtime.
 */

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '../..');

type Catalogue = Record<string, unknown>;

function loadCatalogue(locale: 'en' | 'lt'): Catalogue {
  return JSON.parse(readFileSync(resolve(webRoot, `messages/${locale}.json`), 'utf8')) as Catalogue;
}

function lookup(catalogue: Catalogue, namespace: string, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (current, part) =>
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[part]
          : undefined,
      catalogue[namespace],
    );
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, out);
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function keysUsed(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const keys = new Set<string>();
  // Fixed keys only: t('some.key'); dynamic template keys are not asserted here.
  for (const match of source.matchAll(/\bt\('([a-zA-Z0-9_.]+)'\)/g)) {
    keys.add(match[1]);
  }
  return [...keys];
}

test('assessment and nav translations are present in both locales (no MISSING_MESSAGE)', () => {
  const catalogues = { en: loadCatalogue('en'), lt: loadCatalogue('lt') };

  const targets: { namespace: string; files: string[] }[] = [
    { namespace: 'Assessment', files: collectFiles(here) },
    {
      namespace: 'Nav',
      files: [resolve(webRoot, 'widgets/auth-nav/auth-nav.tsx')],
    },
  ];

  const missing: string[] = [];
  for (const { namespace, files } of targets) {
    for (const file of files) {
      for (const key of keysUsed(file)) {
        for (const locale of ['en', 'lt'] as const) {
          if (lookup(catalogues[locale], namespace, key) === undefined) {
            missing.push(`${locale}:${namespace}.${key} (${file.slice(webRoot.length + 1)})`);
          }
        }
      }
    }
  }

  assert.deepEqual(missing, [], `Missing translations:\n${missing.join('\n')}`);
});

test('the specific keys from the review are present', () => {
  for (const locale of ['en', 'lt'] as const) {
    const catalogue = loadCatalogue(locale);
    for (const key of [
      'refresh',
      'moduleSynthetic',
      'moduleAstronomy',
      'historyItems',
      'details',
      'attemptIdLabel',
      'cancel',
      'submitConfirmTitle',
      'savedToast',
      'submittedToast',
    ]) {
      const value = lookup(catalogue, 'Assessment', key);
      assert.equal(typeof value, 'string', `${locale}:Assessment.${key}`);
      assert.ok((value as string).trim().length > 0, `${locale}:Assessment.${key} empty`);
    }
    for (const key of ['backToTop', 'menu', 'openMenu', 'closeMenu']) {
      assert.equal(typeof lookup(catalogue, 'Nav', key), 'string', `${locale}:Nav.${key}`);
    }
  }
});
