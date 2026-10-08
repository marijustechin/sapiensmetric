import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NAV_ITEMS,
  SITE_ORIGIN,
  UI_STRINGS,
  publicPagePaths,
} from './site.ts';
import { LOCALES } from '../lib/locale-navigation.ts';

/**
 * Public navigation and shared public strings (T-020). Guards against the public
 * shell exposing unavailable application destinations and against locale string
 * drift after the hamburger-navigation change.
 */

test('public nav lists only published public destinations', () => {
  // Published public destinations: the public page paths plus the articles
  // index (articles themselves are reached from the index, not the header nav).
  const publicPaths = new Set([...publicPagePaths(), 'articles']);
  for (const item of NAV_ITEMS) {
    assert.ok(
      publicPaths.has(item.path),
      `public nav path is not a published public destination: '${item.path}'`,
    );
  }
});

test('public nav never points at auth/account/admin/assessment', () => {
  for (const item of NAV_ITEMS) {
    assert.doesNotMatch(item.path, /(^|\/)(auth|account|admin|assessment)($|\/)/);
  }
});

test('site origin is canonical HTTPS non-www', () => {
  assert.equal(SITE_ORIGIN, 'https://sapiensmetric.eu');
});

test('UI strings expose identical keys per locale', () => {
  const en = Object.keys(UI_STRINGS.en).sort();
  const lt = Object.keys(UI_STRINGS.lt).sort();
  assert.deepEqual(lt, en);
});

test('navigation and drawer labels are present and non-empty in both locales', () => {
  const required = [
    'skipToContent',
    'primaryNav',
    'footerNav',
    'menu',
    'openMenu',
    'closeMenu',
  ] as const;
  for (const locale of LOCALES) {
    for (const key of required) {
      const value = UI_STRINGS[locale][key];
      assert.equal(typeof value, 'string');
      assert.ok(value.trim().length > 0, `${locale}.${key} must not be empty`);
    }
  }
});
