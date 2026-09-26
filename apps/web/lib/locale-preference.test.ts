import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { DEFAULT_LOCALE, LOCALES } from './locale-navigation.ts';
import {
  LOCALE_PREFERENCE_KEY,
  LOCALE_TARGETS,
  persistLocalePreference,
  readLocalePreference,
  resolveRootTarget,
  resolveRootTargetFromStorage,
  type LocalePreferenceStorage,
} from './locale-preference.ts';

const here = dirname(fileURLToPath(import.meta.url));

function fakeStorage(initial?: string) {
  const store = {
    value: (initial ?? null) as string | null,
    getItem(key: string) {
      return key === LOCALE_PREFERENCE_KEY ? store.value : null;
    },
    setItem(key: string, value: string) {
      if (key === LOCALE_PREFERENCE_KEY) {
        store.value = value;
      }
    },
  };
  return store;
}

test('no stored preference resolves to the default locale (/en/)', () => {
  assert.equal(resolveRootTargetFromStorage(fakeStorage()), '/en/');
  assert.equal(resolveRootTargetFromStorage(undefined), '/en/');
  assert.equal(resolveRootTarget(null), '/en/');
  assert.equal(resolveRootTarget(undefined), '/en/');
});

test('stored lt resolves to /lt/', () => {
  assert.equal(resolveRootTargetFromStorage(fakeStorage('lt')), '/lt/');
});

test('stored en resolves to /en/', () => {
  assert.equal(resolveRootTargetFromStorage(fakeStorage('en')), '/en/');
});

test('an unsupported stored value falls back to the default locale', () => {
  for (const value of ['ru', 'EN', '', ' lt', '  ', 42, {}, ['lt']]) {
    assert.equal(resolveRootTarget(value), '/en/', `expected ${String(value)}`);
  }
});

test('targets stay consistent with the supported locales and the default', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.deepEqual(Object.keys(LOCALE_TARGETS).sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    assert.equal(LOCALE_TARGETS[locale], `/${locale}/`);
  }
  assert.equal(resolveRootTarget(null), `/${DEFAULT_LOCALE}/`);
});

test('entering a locale persists the preference; unsupported values do not', () => {
  const storage = fakeStorage();
  persistLocalePreference(storage, 'lt');
  assert.equal(readLocalePreference(storage), 'lt');
  persistLocalePreference(storage, 'en');
  assert.equal(readLocalePreference(storage), 'en');
  persistLocalePreference(storage, 'ru');
  assert.equal(readLocalePreference(storage), 'en');
  // Null/undefined storage is a no-op rather than a crash.
  assert.doesNotThrow(() => persistLocalePreference(undefined, 'lt'));
  assert.doesNotThrow(() => persistLocalePreference(null, 'lt'));
});

test('storage failures are tolerated', () => {
  const throwing = {
    getItem(): string | null {
      throw new Error('blocked');
    },
    setItem(): void {
      throw new Error('blocked');
    },
  } satisfies LocalePreferenceStorage;
  assert.equal(readLocalePreference(throwing), null);
  assert.doesNotThrow(() => persistLocalePreference(throwing, 'lt'));
  assert.equal(resolveRootTargetFromStorage(throwing), '/en/');
});

test('the root page renders a centred loading state, not a chooser or meta refresh', () => {
  const page = readFileSync(resolve(here, '../app/(root)/page.tsx'), 'utf8');
  assert.match(page, /role="status"/);
  assert.match(page, /aria-busy="true"/);
  assert.match(page, /animate-spin/);
  assert.match(page, /resolveRootTargetFromStorage/);
  assert.match(page, /location\.replace/);
  assert.doesNotMatch(page, /http-equiv|httpEquiv/i);
  assert.doesNotMatch(page, /Pasirinkite kalb/i);
  assert.doesNotMatch(page, /Choose a language/i);
  assert.doesNotMatch(page, /Redirecting/i);
});

test('entering a localized route wires the preference sync (persistence)', () => {
  const layout = readFileSync(resolve(here, '../app/[locale]/layout.tsx'), 'utf8');
  assert.match(layout, /LocalePreferenceSync/);
  assert.match(layout, /locale=\{locale\}/);
});
