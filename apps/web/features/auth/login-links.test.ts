import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loginHref } from './auth-navigation.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('the login page offers the existing registration link', () => {
  const forms = readFileSync(resolve(here, './auth-forms.tsx'), 'utf8');
  assert.match(forms, /href="\/auth\/register"/);
  assert.match(forms, /sanitizeReturnTo/);
});

test('loginHref preserves the destination as a safe encoded returnTo', () => {
  const href = loginHref('en', '/en/admin/');
  assert.equal(href, '/en/auth/login?returnTo=%2Fen%2Fadmin%2F');
  assert.equal(loginHref('lt'), '/lt/auth/login');
});
