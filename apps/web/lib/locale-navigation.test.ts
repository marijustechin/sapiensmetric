import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localizePath,
  otherLocale,
  switchLocaleTarget,
} from './locale-navigation.ts';

test('isLocale accepts exactly the supported UI locales', () => {
  for (const locale of LOCALES) {
    assert.equal(isLocale(locale), true);
  }
  const rejected: unknown[] = [
    'ru',
    'EN',
    'Lt',
    '',
    ' lt',
    null,
    undefined,
    42,
    {},
    ['lt'],
  ];
  for (const value of rejected) {
    assert.equal(isLocale(value), false, `expected ${String(value)} to be rejected`);
  }
});

test('default locale is supported and otherLocale flips it', () => {
  assert.ok((LOCALES as readonly string[]).includes(DEFAULT_LOCALE));
  assert.equal(otherLocale('lt'), 'en');
  assert.equal(otherLocale('en'), 'lt');
});

test('fallback default locale matches the API authentication default (en)', () => {
  // The API defaults register and verification/reset requests to `en` and the
  // Google start endpoint resolves anything other than `lt` to `en`.
  assert.equal(DEFAULT_LOCALE, 'en');
});

test('localizePath switches the locale and preserves query/fragment', () => {
  assert.equal(localizePath('/lt/account', 'en'), '/en/account');
  assert.equal(
    localizePath('/en/account?tab=profile', 'lt'),
    '/lt/account?tab=profile',
  );
  assert.equal(localizePath('/account', 'en'), '/en/account');
  assert.equal(localizePath('/lt', 'en'), '/en');
  assert.equal(localizePath('/', 'en'), '/en');
});

test('default account destinations are locale-specific', () => {
  assert.equal(localizePath('/account', 'lt'), '/lt/account');
  assert.equal(localizePath('/account', 'en'), '/en/account');
});

test('localizePath rejects external, protocol-relative and malformed values', () => {
  const rejected: unknown[] = [
    'https://evil.example/',
    '//evil.example',
    '/\\evil',
    'relative/path',
    'javascript:alert(1)',
    '',
    '   ',
    null,
    undefined,
    42,
  ];
  for (const value of rejected) {
    assert.equal(localizePath(value, 'en'), null);
  }
});

test('switchLocaleTarget returns the equivalent locale-less route', () => {
  assert.equal(
    switchLocaleTarget({ pathname: '/', search: '', targetLocale: 'en' }),
    '/',
  );
  assert.equal(
    switchLocaleTarget({ pathname: '/account', search: '', targetLocale: 'lt' }),
    '/account',
  );
});

test('switchLocaleTarget remaps a safe returnTo to the target locale', () => {
  assert.equal(
    switchLocaleTarget({
      pathname: '/auth/login',
      search: '?returnTo=%2Flt%2Faccount',
      targetLocale: 'en',
    }),
    '/auth/login?returnTo=%2Fen%2Faccount',
  );
  assert.equal(
    switchLocaleTarget({
      pathname: '/auth/login',
      search: '?returnTo=%2Fen%2Faccount%3Fx%3D1',
      targetLocale: 'lt',
    }),
    '/auth/login?returnTo=%2Flt%2Faccount%3Fx%3D1',
  );
});

test('switchLocaleTarget drops an unsafe returnTo but keeps other query params', () => {
  assert.equal(
    switchLocaleTarget({
      pathname: '/auth/login',
      search: '?returnTo=https%3A%2F%2Fevil.example&googleError=1',
      targetLocale: 'en',
    }),
    '/auth/login?googleError=1',
  );
  assert.equal(
    switchLocaleTarget({
      pathname: '/auth/login',
      search: '?returnTo=%2F%2Fevil.example',
      targetLocale: 'en',
    }),
    '/auth/login',
  );
});
