import test from 'node:test';
import assert from 'node:assert/strict';
import {
  googleButtonLabel,
  googleStartUrl,
  googleUnavailableNote,
} from './google-auth.ts';
import { sanitizeReturnTo } from './auth-navigation.ts';
import type { Locale } from './auth-types.ts';

const LOCALES: Locale[] = ['lt', 'en'];
const WEB_ORIGIN = 'http://localhost:3001';
const API_BASE = 'http://localhost:3334';

test('googleStartUrl targets the API start endpoint with the locale', () => {
  assert.equal(
    googleStartUrl('http://localhost:3334', 'lt'),
    'http://localhost:3334/auth/google/start?locale=lt',
  );
});

test('googleStartUrl normalises a trailing slash and encodes returnTo', () => {
  assert.equal(
    googleStartUrl('http://localhost:3334/', 'en', '/en/account?x=1&y=2'),
    'http://localhost:3334/auth/google/start?locale=en&returnTo=%2Fen%2Faccount%3Fx%3D1%26y%3D2',
  );
});

test('login query returnTo propagates into the Google start URL', () => {
  // Mirrors /en/auth/login?returnTo=%2Fen%2Faccount.
  const params = new URLSearchParams('?returnTo=%2Fen%2Faccount');
  const target = sanitizeReturnTo(
    params.get('returnTo'),
    WEB_ORIGIN,
    '/en/account',
  );
  assert.equal(target, '/en/account');
  assert.equal(
    googleStartUrl(API_BASE, 'en', target),
    'http://localhost:3334/auth/google/start?locale=en&returnTo=%2Fen%2Faccount',
  );
});

test('defaults LT and EN targets when no returnTo is present', () => {
  for (const locale of LOCALES) {
    const target = sanitizeReturnTo(
      new URLSearchParams('').get('returnTo'),
      WEB_ORIGIN,
      `/${locale}/account`,
    );
    assert.equal(target, `/${locale}/account`);
    assert.equal(
      googleStartUrl(API_BASE, locale, target),
      `http://localhost:3334/auth/google/start?locale=${locale}&returnTo=%2F${locale}%2Faccount`,
    );
  }
});

test('external and malformed login returnTo are rejected to the safe default', () => {
  const badValues = [
    'https://evil.example/steal',
    '//evil.example',
    'javascript:alert(1)',
    '/\\evil',
    'relative/path',
  ];
  for (const bad of badValues) {
    const target = sanitizeReturnTo(bad, WEB_ORIGIN, '/en/account');
    assert.equal(target, '/en/account');
    assert.ok(!googleStartUrl(API_BASE, 'en', target).includes('evil'));
  }
});

test('button label and unavailable note exist for both locales', () => {
  for (const locale of LOCALES) {
    assert.ok(googleButtonLabel(locale).length > 0);
    assert.ok(googleUnavailableNote(locale).length > 0);
  }
  assert.notEqual(googleButtonLabel('lt'), googleButtonLabel('en'));
});
