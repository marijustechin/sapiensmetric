import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  accountPath,
  adminReturnTo,
  decideAdminEntry,
  probeFromOutcome,
} from './admin-access.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('waits while the session is still resolving', () => {
  for (const locale of ['en', 'lt']) {
    assert.deepEqual(
      decideAdminEntry({ authStatus: 'loading', probe: 'pending', locale }),
      { kind: 'waiting' },
    );
  }
});

test('waits while the admin probe is pending after bootstrap', () => {
  assert.deepEqual(
    decideAdminEntry({ authStatus: 'authenticated', probe: 'pending', locale: 'en' }),
    { kind: 'waiting' },
  );
});

test('renders admin only once the probe succeeds', () => {
  assert.deepEqual(
    decideAdminEntry({ authStatus: 'authenticated', probe: 'success', locale: 'en' }),
    { kind: 'render' },
  );
});

test('unauthenticated visitors go to login preserving the admin destination and locale', () => {
  for (const locale of ['en', 'lt']) {
    const decision = decideAdminEntry({
      authStatus: 'unauthenticated',
      probe: 'pending',
      locale,
    });
    assert.equal(decision.kind, 'sign-in');
    if (decision.kind === 'sign-in') {
      assert.equal(decision.returnTo, `/${locale}/admin/`);
    }
  }
  assert.equal(adminReturnTo('lt'), '/lt/admin/');
});

test('authenticated non-admins are redirected to Account in the same locale', () => {
  for (const locale of ['en', 'lt']) {
    const decision = decideAdminEntry({
      authStatus: 'authenticated',
      probe: 'forbidden',
      locale,
    });
    assert.equal(decision.kind, 'redirect-account');
    if (decision.kind === 'redirect-account') {
      assert.equal(decision.path, `/${locale}/account/`);
    }
  }
  assert.equal(accountPath('en'), '/en/account/');
});

test('an expired session reuses the login/returnTo recovery', () => {
  const decision = decideAdminEntry({
    authStatus: 'authenticated',
    probe: 'unauthorized',
    locale: 'en',
  });
  assert.equal(decision.kind, 'sign-in');
  if (decision.kind === 'sign-in') {
    assert.equal(decision.returnTo, '/en/admin/');
  }
});

test('network/server probe failures offer retry, never a permission redirect', () => {
  assert.equal(
    decideAdminEntry({ authStatus: 'authenticated', probe: 'error', locale: 'en' }).kind,
    'probe-error',
  );
  assert.equal(
    decideAdminEntry({ authStatus: 'error', probe: 'pending', locale: 'en' }).kind,
    'session-error',
  );
});

test('probe outcome mapping distinguishes access loss from transient errors', () => {
  assert.equal(probeFromOutcome('success'), 'success');
  assert.equal(probeFromOutcome('forbidden'), 'forbidden');
  assert.equal(probeFromOutcome('unauthorized'), 'unauthorized');
  // httpError covers 400/409 validation and 5xx; networkError is transient.
  // Neither is a permission outcome, so both map to a retryable 'error'.
  assert.equal(probeFromOutcome('httpError'), 'error');
  assert.equal(probeFromOutcome('networkError'), 'error');
});

test('the admin screen renders the shared loading state and never a forbidden screen', () => {
  const screen = readFileSync(resolve(here, './admin-screen.tsx'), 'utf8');
  assert.match(screen, /decideAdminEntry/);
  assert.match(screen, /LoadingScreen/);
  assert.match(screen, /loginHref/);
  assert.doesNotMatch(screen, /t\('forbidden'\)/);
});
