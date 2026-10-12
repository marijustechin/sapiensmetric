import test from 'node:test';
import assert from 'node:assert/strict';
import { signOutToHome } from './sign-out.ts';

test('signOutToHome revokes the session then returns to the locale home entry', async () => {
  const calls: string[] = [];
  const original = globalThis.window;
  (globalThis as { window?: unknown }).window = {
    location: { assign: (href: string) => calls.push(`assign:${href}`) },
  };
  try {
    await signOutToHome(async () => {
      calls.push('logout');
    }, 'lt');
  } finally {
    (globalThis as { window?: unknown }).window = original;
  }
  assert.deepEqual(calls, ['logout', 'assign:/lt']);
});

test('signOutToHome still returns home when the session revoke fails', async () => {
  const calls: string[] = [];
  const original = globalThis.window;
  (globalThis as { window?: unknown }).window = {
    location: { assign: (href: string) => calls.push(`assign:${href}`) },
  };
  try {
    await signOutToHome(async () => {
      calls.push('logout');
      throw new Error('network down');
    }, 'en');
  } finally {
    (globalThis as { window?: unknown }).window = original;
  }
  assert.deepEqual(calls, ['logout', 'assign:/en']);
});
