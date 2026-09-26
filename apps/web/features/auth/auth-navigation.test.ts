import test from 'node:test';
import assert from 'node:assert/strict';
import { loginHref, sanitizeReturnTo } from './auth-navigation.ts';

const ORIGIN = 'https://app.example.test';

test('sanitizeReturnTo accepts same-origin absolute paths', () => {
  assert.equal(sanitizeReturnTo('/lt/account', ORIGIN), '/lt/account');
  assert.equal(
    sanitizeReturnTo('/en/account?tab=profile', ORIGIN),
    '/en/account?tab=profile',
  );
});

test('sanitizeReturnTo rejects external and unsafe targets', () => {
  assert.equal(sanitizeReturnTo('https://evil.example/', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('//evil.example/', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('/\\evil.example', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('javascript:alert(1)', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('relative/path', ORIGIN), '/');
  assert.equal(sanitizeReturnTo('', ORIGIN), '/');
  assert.equal(sanitizeReturnTo(undefined, ORIGIN), '/');
  assert.equal(sanitizeReturnTo('/a\u0000b', ORIGIN), '/');
});

test('sanitizeReturnTo honours a custom fallback', () => {
  assert.equal(sanitizeReturnTo('https://evil.example/', ORIGIN, '/en'), '/en');
});

test('loginHref encodes returnTo', () => {
  assert.equal(loginHref('lt'), '/lt/auth/login');
  assert.equal(
    loginHref('en', '/en/account?x=1&y=2'),
    '/en/auth/login?returnTo=%2Fen%2Faccount%3Fx%3D1%26y%3D2',
  );
});
