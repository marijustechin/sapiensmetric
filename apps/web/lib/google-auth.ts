/**
 * Pure helpers for the Google sign-in button (T-007). No secrets are involved:
 * the browser only navigates to the API start endpoint; the client ID, secret,
 * and redirect URI stay server-side.
 */

import type { Locale } from './auth-types';

export function googleStartUrl(
  apiBase: string,
  locale: Locale,
  returnTo?: string,
): string {
  const base = apiBase.replace(/\/+$/, '');
  const params = new URLSearchParams({ locale });
  if (returnTo) {
    params.set('returnTo', returnTo);
  }
  return `${base}/auth/google/start?${params.toString()}`;
}

export function googleButtonLabel(locale: Locale): string {
  return locale === 'lt' ? 'Prisijungti su Google' : 'Sign in with Google';
}

export function googleUnavailableNote(locale: Locale): string {
  return locale === 'lt'
    ? 'Prisijungimas su Google šioje aplinkoje nesukonfigūruotas.'
    : 'Google sign-in is not configured in this environment.';
}
