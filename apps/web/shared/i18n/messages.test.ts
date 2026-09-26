import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { LOCALES, type AppLocale } from '../lib/locale-navigation.ts';

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(here, '../../messages');

type Catalogue = Record<string, unknown>;

function loadCatalogue(locale: AppLocale): Catalogue {
  const raw = readFileSync(resolve(messagesDir, `${locale}.json`), 'utf8');
  return JSON.parse(raw) as Catalogue;
}

/** Flatten a nested catalogue to dotted leaf paths. */
function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
}

function lookup(catalogue: Catalogue, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((current, part) => {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[part];
  }, catalogue);
}

/**
 * Critical UI keys that every locale catalogue must expose. These cover the
 * home, navigation, auth forms/titles, registration feedback, account state,
 * and the Google button. (The root `/` route is a redirect, not a chooser, so
 * there are no chooser keys.)
 */
const CRITICAL_KEYS = [
  'Metadata.title',
  'Metadata.description',
  'Home.description',
  'Nav.home',
  'Nav.login',
  'Nav.register',
  'Nav.verify',
  'Nav.forgot',
  'Nav.account',
  'Nav.signOut',
  'Nav.switchToEnglish',
  'Nav.switchToLithuanian',
  'Auth.title.login',
  'Auth.title.register',
  'Auth.title.verifyEmail',
  'Auth.title.forgotPassword',
  'Auth.title.resetPassword',
  'Auth.title.account',
  'Auth.emailLabel',
  'Auth.passwordLabel',
  'Auth.newPassword',
  'Auth.login',
  'Auth.register',
  'Auth.resend',
  'Auth.verify',
  'Auth.requestReset',
  'Auth.confirmReset',
  'Auth.forgotLink',
  'Auth.registerLink',
  'Auth.loginLink',
  'Auth.generic',
  'Auth.verified',
  'Auth.resetDone',
  'Auth.invalidLink',
  'Auth.missingToken',
  'Auth.invalidCredentials',
  'Auth.invalidInput',
  'Auth.googleError',
  'Auth.error',
  'RegisterFeedback.success',
  'RegisterFeedback.alreadyRegistered',
  'RegisterFeedback.deliveryFailed',
  'RegisterFeedback.invalidInput',
  'RegisterFeedback.error',
  'Account.loading',
  'Account.error',
  'Account.retry',
  'Account.redirecting',
  'Account.signedInAs',
  'Account.notice',
  'Account.signOut',
  'Account.backHome',
  'Google.button',
  'Google.unavailable',
];

test('both locale catalogues load and expose the same nested key set', () => {
  const catalogues = LOCALES.map(loadCatalogue);
  const keySets = catalogues.map((catalogue) => new Set(flattenKeys(catalogue)));

  for (let index = 0; index < LOCALES.length; index += 1) {
    assert.ok(
      keySets[index].size > 0,
      `${LOCALES[index]} catalogue is empty`,
    );
  }

  assert.deepEqual(
    [...keySets[0]].sort(),
    [...keySets[1]].sort(),
    'lt and en catalogues must expose identical keys',
  );
});

test('every critical UI key is present and non-empty in every locale', () => {
  for (const locale of LOCALES) {
    const catalogue = loadCatalogue(locale);
    for (const key of CRITICAL_KEYS) {
      const value = lookup(catalogue, key);
      assert.equal(
        typeof value,
        'string',
        `${locale}:${key} must be a string`,
      );
      assert.ok(
        (value as string).trim().length > 0,
        `${locale}:${key} must not be empty`,
      );
    }
  }
});

test('locale-specific copy differs where it should', () => {
  const lt = loadCatalogue('lt');
  const en = loadCatalogue('en');
  assert.notEqual(
    lookup(lt, 'Home.description'),
    lookup(en, 'Home.description'),
  );
  assert.notEqual(
    lookup(lt, 'Auth.title.login'),
    lookup(en, 'Auth.title.login'),
  );
});
