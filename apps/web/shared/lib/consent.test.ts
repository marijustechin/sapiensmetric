import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_TTL_MS,
  CONSENT_VERSION,
  clearConsent,
  readConsent,
  writeConsent,
  type ConsentStorage,
} from './consent.ts';
import { LOCALE_PREFERENCE_KEY } from './locale-preference.ts';

function fakeStorage(initial?: string) {
  let value = initial ?? null;
  const store: ConsentStorage = {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
  return { store, peek: () => value };
}

test('no stored decision reads as null', () => {
  assert.equal(readConsent(fakeStorage().store), null);
  assert.equal(readConsent(undefined), null);
});

test('acceptance and rejection are persisted and read back', () => {
  const { store } = fakeStorage();
  writeConsent(store, 'granted');
  assert.equal(readConsent(store), 'granted');
  writeConsent(store, 'denied');
  assert.equal(readConsent(store), 'denied');
});

test('the versioned preference carries a documented expiry', () => {
  const { store, peek } = fakeStorage();
  const now = 1_000_000;
  writeConsent(store, 'granted', now);
  const record = JSON.parse(peek() as string) as {
    version: number;
    state: string;
    decidedAt: number;
    expiresAt: number;
  };
  assert.equal(record.version, CONSENT_VERSION);
  assert.equal(record.decidedAt, now);
  assert.equal(record.expiresAt, now + CONSENT_TTL_MS);
  assert.equal(readConsent(store, now + CONSENT_TTL_MS - 1), 'granted');
});

test('expired and version-mismatched values read as no decision', () => {
  const expired = fakeStorage(
    JSON.stringify({ version: 1, state: 'granted', decidedAt: 0, expiresAt: 1 }),
  );
  assert.equal(readConsent(expired.store, 2), null);

  const mismatched = fakeStorage(
    JSON.stringify({ version: 99, state: 'granted', decidedAt: 0, expiresAt: 1e15 }),
  );
  assert.equal(readConsent(mismatched.store), null);

  assert.equal(readConsent(fakeStorage('not json').store), null);
});

test('withdrawal clears the stored decision', () => {
  const { store } = fakeStorage();
  writeConsent(store, 'granted');
  clearConsent(store);
  assert.equal(readConsent(store), null);
});

test('unavailable storage is handled safely', () => {
  const throwing: ConsentStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readConsent(throwing), null);
  assert.equal(writeConsent(throwing, 'granted'), null);
  assert.doesNotThrow(() => clearConsent(throwing));
  assert.equal(readConsent(null), null);
});

test('consent storage is separate from the language preference', () => {
  assert.notEqual(CONSENT_STORAGE_KEY, LOCALE_PREFERENCE_KEY);
});
