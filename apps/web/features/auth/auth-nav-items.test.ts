import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthNavItems, type AuthNavState } from './auth-nav-items.ts';

const guest = (registrationEnabled: boolean): AuthNavState => ({
  authenticated: false,
  isAdmin: false,
  registrationEnabled,
});
const user: AuthNavState = { authenticated: true, isAdmin: false, registrationEnabled: true };
const admin: AuthNavState = { authenticated: true, isAdmin: true, registrationEnabled: true };

const keys = (state: AuthNavState) => buildAuthNavItems(state).map((i) => i.labelKey);
const hrefs = (state: AuthNavState) => buildAuthNavItems(state).map((i) => i.href);

test('guest with registration enabled sees Home, Sign in, Register only', () => {
  assert.deepEqual(keys(guest(true)), ['home', 'login', 'register']);
});

test('guest with registration DISABLED sees no Register entry', () => {
  assert.deepEqual(keys(guest(false)), ['home', 'login']);
  assert.ok(!hrefs(guest(false)).includes('/auth/register'));
});

test('guest never sees account-recovery entries in the menu', () => {
  for (const state of [guest(true), guest(false)]) {
    const all = hrefs(state);
    assert.ok(!all.includes('/auth/verify-email'));
    assert.ok(!all.includes('/auth/forgot-password'));
  }
});

test('authenticated user sees Home, Account, Assessment (no Admin, no guest-only, no recovery)', () => {
  assert.deepEqual(keys(user), ['home', 'account', 'assessment']);
  const all = hrefs(user);
  for (const gone of ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/forgot-password', '/admin']) {
    assert.ok(!all.includes(gone), `authenticated user must not see ${gone}`);
  }
});

test('authenticated administrator additionally sees Admin (API-confirmed role)', () => {
  assert.deepEqual(keys(admin), ['home', 'account', 'assessment', 'admin']);
  assert.ok(hrefs(admin).includes('/admin'));
});

test('authenticated navigation is registration-disabled-safe', () => {
  // Registration being off must not change the authenticated item set.
  const off: AuthNavState = { ...user, registrationEnabled: false };
  assert.deepEqual(keys(off), ['home', 'account', 'assessment']);
  assert.deepEqual(keys({ ...admin, registrationEnabled: false }), ['home', 'account', 'assessment', 'admin']);
});
