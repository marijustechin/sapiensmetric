/**
 * Versioned analytics consent preference (T-014 analytics extension).
 *
 * Stored in localStorage under a key separate from the language preference.
 * Requests are gated on this value; storage failures are handled safely (an
 * unreadable/unavailable store is treated as "no decision yet").
 */

export const CONSENT_STORAGE_KEY = 'sapiensmetric.analytics-consent';
export const CONSENT_VERSION = 1;
/** 180 days, as documented in the privacy page and release docs. */
export const CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000;

export type ConsentState = 'granted' | 'denied';

export interface StoredConsent {
  version: number;
  state: ConsentState;
  decidedAt: number;
  expiresAt: number;
}

export interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parse(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredConsent>;
    if (
      value.version !== CONSENT_VERSION ||
      (value.state !== 'granted' && value.state !== 'denied') ||
      typeof value.decidedAt !== 'number' ||
      typeof value.expiresAt !== 'number'
    ) {
      return null;
    }
    return value as StoredConsent;
  } catch {
    return null;
  }
}

/** Read a still-valid decision, or `null` when absent/expired/invalid. */
export function readConsent(
  storage: ConsentStorage | null | undefined,
  now: number = Date.now(),
): ConsentState | null {
  if (!storage) return null;
  try {
    const stored = parse(storage.getItem(CONSENT_STORAGE_KEY));
    if (!stored || stored.expiresAt <= now) return null;
    return stored.state;
  } catch {
    return null;
  }
}

export function writeConsent(
  storage: ConsentStorage | null | undefined,
  state: ConsentState,
  now: number = Date.now(),
): StoredConsent | null {
  if (!storage) return null;
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    state,
    decidedAt: now,
    expiresAt: now + CONSENT_TTL_MS,
  };
  try {
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
}

export function clearConsent(storage: ConsentStorage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Analytics cookies created by this integration that we attempt to remove. */
export function analyticsCookieNames(cookieNames: string[]): string[] {
  return cookieNames.filter(
    (name) => name === '_ga' || name.startsWith('_ga_') || name === '_gcl_au',
  );
}
